import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { AuthUser } from '../auth/auth.types'
import { Page, PaginationQueryDto } from '../common/pagination.dto'
import { OPEN_DEAL_STATUSES } from '../deals/deal-state'
import { PrismaService } from '../prisma/prisma.service'
import { UploadsService } from '../uploads/uploads.service'
import { CreateItemDto } from './dto/create-item.dto'
import { ListItemsQueryDto } from './dto/list-items-query.dto'
import { SetItemVisibilityDto } from './dto/set-item-visibility.dto'
import { UpdateItemDto } from './dto/update-item.dto'
import { canTransitionItem } from './item-state'
import { cardInclude, detailsInclude, toCard, toDetails, toPublicUser } from './items.mapper'
import { ItemCardDto, ItemDetailsDto } from './items.responses'
import { containsPrice } from './price-guard'


const invalid = (message: string, field: string) => new BadRequestException({ statusCode: 400, message, field })

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  // ───────────── Чтение ─────────────

  async list(query: ListItemsQueryDto): Promise<Page<ItemCardDto>> {
    const where: Prisma.ItemWhereInput = {
      status: 'published',
      deletedAt: null,
      source: query.source,
      categoryId: query.categoryId,
      condition: query.condition,
      transferFormat: query.transferFormat,
      districtId: query.districtId,
      publishedAt: query.publishedAfter ? { gte: new Date(query.publishedAfter) } : undefined,
      OR: query.q
        ? [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    }
    const direction = query.sort === 'old' ? 'asc' : 'desc'
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        include: cardInclude,
        orderBy: [{ publishedAt: direction }, { id: direction }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.item.count({ where }),
    ])
    return { items: rows.map(toCard), page: query.page, limit: query.limit, total }
  }

  async listMine(userId: number, query: PaginationQueryDto): Promise<Page<ItemCardDto>> {
    const where: Prisma.ItemWhereInput = { ownerId: userId, deletedAt: null }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        include: cardInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.item.count({ where }),
    ])
    return { items: rows.map(toCard), page: query.page, limit: query.limit, total }
  }

  async get(id: number, viewer?: AuthUser): Promise<ItemDetailsDto> {
    const item = await this.prisma.item.findFirst({ where: { id, deletedAt: null }, include: detailsInclude })
    if (!item) throw new NotFoundException('Объявление не найдено.')

    const isOwner = viewer?.id === item.ownerId
    if ((item.status === 'hidden' || item.status === 'rejected') && !isOwner && viewer?.role !== 'admin') {
      throw new NotFoundException('Объявление не найдено.')
    }

    const completedDeals = await this.prisma.deal.count({
      where: { status: 'completed', OR: [{ giverId: item.ownerId }, { receiverId: item.ownerId }] },
    })
    const activeDeal =
      viewer && !isOwner
        ? await this.prisma.deal.findFirst({
            where: { itemId: id, receiverId: viewer.id, status: { in: OPEN_DEAL_STATUSES } },
            select: { id: true, status: true },
          })
        : null

    return toDetails(item, toPublicUser(item.owner, completedDeals), {
      isOwner,
      canRequest: !!viewer && !isOwner && item.status === 'published' && !activeDeal,
      activeDealId: activeDeal?.id ?? null,
      activeDealStatus: activeDeal?.status ?? null,
    })
  }

  // ───────────── Запись ─────────────

  async create(user: AuthUser, dto: CreateItemDto): Promise<ItemDetailsDto> {
    const wantedInReturn = dto.transferFormat === 'exchange' ? dto.wantedInReturn! : null
    this.assertNoPrice({ title: dto.title, description: dto.description, wantedInReturn })
    await this.assertCategory(dto.categoryId, dto.weightKg ?? null)
    await this.assertDistrict(dto.districtId)
    const photoKeys = await this.checkPhotos(dto.photoKeys)

    const item = await this.prisma.item.create({
      data: {
        ownerId: user.id,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        condition: dto.condition,
        transferFormat: dto.transferFormat,
        wantedInReturn,
        quantity: dto.quantity ?? 1,
        weightKg: dto.weightKg,
        districtId: dto.districtId,
        meetingNote: dto.meetingNote,
        photos: { create: photoKeys.map((key, position) => ({ url: this.uploads.urlFor(key), position })) },
      },
      select: { id: true },
    })
    return this.get(item.id, user)
  }

  async update(id: number, user: AuthUser, dto: UpdateItemDto): Promise<ItemDetailsDto> {
    const current = await this.findEditable(id, user, true)
    if (current.status === 'transferred' || current.status === 'rejected') {
      throw new ConflictException('Это объявление уже нельзя изменить.')
    }

    const transferFormat = dto.transferFormat ?? current.transferFormat
    const wanted = dto.wantedInReturn !== undefined ? dto.wantedInReturn : current.wantedInReturn
    if (transferFormat === 'exchange' && !wanted) throw invalid('Напишите, что хотите получить взамен.', 'wantedInReturn')
    this.assertNoPrice({
      title: dto.title,
      description: dto.description,
      wantedInReturn: transferFormat === 'exchange' ? wanted : null,
    })

    const categoryId = dto.categoryId ?? current.categoryId
    const weightKg = dto.weightKg !== undefined ? dto.weightKg : current.weightKg
    await this.assertCategory(categoryId, weightKg)
    if (dto.districtId !== undefined) await this.assertDistrict(dto.districtId)

    if (dto.categoryId !== undefined || dto.quantity !== undefined || dto.weightKg !== undefined) {
      if ((await this.countOpenDeals(id)) > 0) {
        throw new ConflictException('По объявлению есть незавершённая сделка: категорию, количество и вес менять нельзя.')
      }
    }

    const photoKeys = dto.photoKeys ? await this.checkPhotos(dto.photoKeys) : null

    await this.prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          categoryId: dto.categoryId,
          condition: dto.condition,
          transferFormat: dto.transferFormat,
          wantedInReturn: transferFormat === 'exchange' ? wanted : null,
          quantity: dto.quantity,
          weightKg: dto.weightKg,
          districtId: dto.districtId,
          meetingNote: dto.meetingNote,
        },
      })
      if (photoKeys) {
        await tx.itemPhoto.deleteMany({ where: { itemId: id } })
        await tx.itemPhoto.createMany({
          data: photoKeys.map((key, position) => ({ itemId: id, url: this.uploads.urlFor(key), position })),
        })
      }
    })
    return this.get(id, user)
  }

  async setVisibility(id: number, user: AuthUser, dto: SetItemVisibilityDto): Promise<ItemDetailsDto> {
    const item = await this.findEditable(id, user, false)
    const target = dto.hidden ? 'hidden' : 'published'
    if (item.status === target) return this.get(id, user) 

    if (!dto.hidden && item.moderationNote) throw new ForbiddenException('Объявление скрыто модератором.')
    if (!canTransitionItem(item.status, target, 'owner')) {
      throw new ConflictException(
        item.status === 'reserved'
          ? 'Вещь зарезервирована: сначала отмените сделку.'
          : 'Сейчас это действие недоступно.',
      )
    }
    await this.prisma.item.update({ where: { id }, data: { status: target } })
    return this.get(id, user)
  }

  async remove(id: number, user: AuthUser): Promise<void> {
    await this.findEditable(id, user, true)
    if ((await this.countOpenDeals(id)) > 0) {
      throw new ConflictException('По объявлению есть незавершённая сделка: завершите или отмените её.')
    }
    await this.prisma.item.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  // ───────────── Проверки ─────────────

  private async findEditable(id: number, user: AuthUser, adminAllowed: boolean) {
    const item = await this.prisma.item.findFirst({ where: { id, deletedAt: null } })
    if (!item) throw new NotFoundException('Объявление не найдено.')
    const allowed = item.ownerId === user.id || (adminAllowed && user.role === 'admin')
    if (!allowed) throw new ForbiddenException('Это не ваше объявление.')
    return item
  }

  private countOpenDeals(itemId: number) {
    return this.prisma.deal.count({ where: { itemId, status: { in: OPEN_DEAL_STATUSES } } })
  }

  private assertNoPrice(fields: { title?: string; description?: string; wantedInReturn?: string | null }) {
    for (const [field, text] of Object.entries(fields)) {
      if (containsPrice(text)) {
        throw invalid('Платформа только для бесплатной передачи и обмена: уберите цену из текста.', field)
      }
    }
  }

  private async assertCategory(categoryId: number, weightKg: number | null) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
      include: { coefficients: { where: { validFrom: { lte: new Date() } }, orderBy: { validFrom: 'desc' }, take: 1 } },
    })
    if (!category) throw invalid('Такой категории нет.', 'categoryId')
    if (category.coefficients[0]?.avgMassKg == null && weightKg == null) {
      throw invalid('Для этой категории укажите вес вещей.', 'weightKg')
    }
  }

  private async assertDistrict(districtId: number) {
    if (!(await this.prisma.district.findUnique({ where: { id: districtId } }))) {
      throw invalid('Такого района нет.', 'districtId')
    }
  }

  private async checkPhotos(keys: string[]): Promise<string[]> {
    const unique = [...new Set(keys)]
    if ((await this.uploads.missingKeys(unique)).length > 0) {
      throw invalid('Фотография не найдена. Загрузите её заново.', 'photoKeys')
    }
    return unique
  }
}
