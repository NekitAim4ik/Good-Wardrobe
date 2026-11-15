import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common'
import { CancelReason, DealStatus, NotificationType, Prisma } from '@prisma/client'
import { AuthUser } from '../auth/auth.types'
import { Page } from '../common/pagination.dto'
import { toPublicUser } from '../items/items.mapper'
import { isItemOpenForRequests } from '../items/item-state'
import { PrismaService } from '../prisma/prisma.service'
import {
  availableDealActions, canTransitionDeal, DealRole, OPEN_DEAL_STATUSES,
} from './deal-state'
import { dealInclude, DealLoaded, round2, toItemDto, toMessageDto } from './deals.mapper'
import { AcceptDealDto } from './dto/accept-deal.dto'
import { CancelDealDto } from './dto/cancel-deal.dto'
import { CreateDealDto } from './dto/create-deal.dto'
import { ListDealsQueryDto } from './dto/list-deals-query.dto'
import { ListMessagesQueryDto } from './dto/list-messages-query.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { DealCreatedDto, DealDetailsDto, DealSummaryDto, MessageDto, ReviewDto } from './deals.responses'

const CANCEL_LABELS: Record<CancelReason, string> = {
  changed_mind: 'передумал(а)',
  no_response: 'нет ответа',
  item_unavailable: 'вещь больше недоступна',
  no_show: 'не удалось встретиться',
  other: 'другая причина',
}

const changed = () => new ConflictException('Статус сделки только что изменился. Обновите страницу.')

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────── Создание («Написать автору») ─────────────

  async create(user: AuthUser, dto: CreateDealDto): Promise<DealCreatedDto> {
    const item = await this.prisma.item.findFirst({
      where: { id: dto.itemId, deletedAt: null },
      select: { id: true, ownerId: true, status: true },
    })
    if (!item || item.status === 'hidden' || item.status === 'rejected') {
      throw new NotFoundException('Объявление не найдено.')
    }
    if (item.ownerId === user.id) {
      throw new BadRequestException('Это ваше объявление: писать самому себе не нужно.')
    }

    const existing = await this.findOpenDeal(item.id, user.id)
    if (existing) return { ...existing, created: false }

    if (!isItemOpenForRequests(item.status)) {
      throw new ConflictException('Эта вещь уже недоступна: автор договорился с другим человеком или передал её.')
    }

    try {
      const deal = await this.prisma.$transaction(async (tx) => {
        const created = await tx.deal.create({
          data: { itemId: item.id, giverId: item.ownerId, receiverId: user.id },
          select: { id: true, status: true },
        })
        await tx.message.create({ data: { dealId: created.id, senderId: user.id, body: dto.message } })
        await this.notify(tx, item.ownerId, 'deal_requested', created.id, item.id)
        return created
      })
      return { ...deal, created: true }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const again = await this.findOpenDeal(item.id, user.id)
        if (again) return { ...again, created: false }
      }
      throw e
    }
  }

  // ───────────── Чтение ─────────────

  async list(user: AuthUser, query: ListDealsQueryDto): Promise<Page<DealSummaryDto>> {
    const mine: Prisma.DealWhereInput =
      query.role === 'giver' ? { giverId: user.id }
      : query.role === 'receiver' ? { receiverId: user.id }
      : { OR: [{ giverId: user.id }, { receiverId: user.id }] }
    const where: Prisma.DealWhereInput = { ...mine, status: query.status }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        include: { ...dealInclude, messages: { orderBy: { id: 'desc' }, take: 1 } },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.deal.count({ where }),
    ])

    const unread = await this.prisma.message.groupBy({
      by: ['dealId'],
      where: { dealId: { in: rows.map((d) => d.id) }, readAt: null, senderId: { not: user.id } },
      _count: { _all: true },
    })
    const unreadByDeal = new Map(unread.map((u) => [u.dealId, u._count._all]))

    const items = rows.map((d): DealSummaryDto => {
      const role: DealRole = d.giverId === user.id ? 'giver' : 'receiver'
      const other = role === 'giver' ? d.receiver : d.giver
      const last = d.messages[0]
      return {
        id: d.id,
        status: d.status,
        role,
        item: toItemDto(d.item),
        counterpart: { id: other.id, name: other.name },
        lastMessage: last ? { kind: last.kind, body: last.body, createdAt: last.createdAt.toISOString() } : null,
        unreadCount: unreadByDeal.get(d.id) ?? 0,
        updatedAt: d.updatedAt.toISOString(),
      }
    })
    return { items, page: query.page, limit: query.limit, total }
  }

  async get(id: number, user: AuthUser): Promise<DealDetailsDto> {
    const deal = await this.load(id, user)
    const role = this.roleOf(deal, user)
    const other = role === 'giver' ? deal.receiver : deal.giver

    const [completedDeals, reviews, eco] = await Promise.all([
      this.prisma.deal.count({
        where: { status: 'completed', OR: [{ giverId: other.id }, { receiverId: other.id }] },
      }),
      this.prisma.review.findMany({ where: { dealId: id }, include: { author: { select: { name: true } } } }),
      this.prisma.ecoRecord.findUnique({ where: { dealId: id }, include: { category: { select: { name: true } } } }),
    ])
    const toReview = (r: (typeof reviews)[number]): ReviewDto => ({
      id: r.id, rating: r.rating, text: r.text, authorName: r.author.name, createdAt: r.createdAt.toISOString(),
    })
    const mine = reviews.find((r) => r.authorId === user.id)
    const theirs = reviews.find((r) => r.authorId !== user.id && !r.isHidden)

    return {
      id: deal.id,
      status: deal.status,
      role,
      item: toItemDto(deal.item),
      counterpart: toPublicUser(other, completedDeals),
      meetingAt: deal.meetingAt?.toISOString() ?? null,
      meetingNote: deal.meetingNote,
      handedOverAt: deal.handedOverAt?.toISOString() ?? null,
      completedAt: deal.completedAt?.toISOString() ?? null,
      cancel: deal.cancelReason
        ? {
            reason: deal.cancelReason,
            comment: deal.cancelComment,
            byMe: deal.cancelledById === user.id,
            at: deal.cancelledAt!.toISOString(),
          }
        : null,
      actions: availableDealActions(deal.status, role, !!mine),
      myReview: mine ? toReview(mine) : null,
      counterpartReview: theirs ? toReview(theirs) : null,
      eco: eco
        ? {
            massKg: round2(eco.massKg),
            massSource: eco.massSource,
            isEstimate: eco.massSource === 'estimated',
            co2eKg: round2(eco.co2eKg),
            categoryName: eco.category.name,
          }
        : null,
      pointsDelta: null, 
    }
  }

  // ───────────── Чат ─────────────

  async listMessages(id: number, user: AuthUser, query: ListMessagesQueryDto): Promise<MessageDto[]> {
    await this.load(id, user)
    const rows =
      query.after === undefined
        ? (await this.prisma.message.findMany({ where: { dealId: id }, orderBy: { id: 'desc' }, take: query.limit })).reverse()
        : await this.prisma.message.findMany({
            where: { dealId: id, id: { gt: query.after } },
            orderBy: { id: 'asc' },
            take: query.limit,
          })
    await this.prisma.message.updateMany({
      where: { dealId: id, readAt: null, senderId: { not: user.id } },
      data: { readAt: new Date() },
    })
    return rows.map((m) => toMessageDto(m, user.id))
  }

  async sendMessage(id: number, user: AuthUser, dto: SendMessageDto): Promise<MessageDto> {
    const deal = await this.load(id, user)
    const role = this.roleOf(deal, user)
    if (!OPEN_DEAL_STATUSES.includes(deal.status)) {
      throw new ConflictException('Сделка закрыта: писать в чат нельзя.')
    }
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({ data: { dealId: id, senderId: user.id, body: dto.body } })
      const next = deal.status === 'requested' && role === 'giver' ? 'negotiating' : undefined
      await tx.deal.updateMany({ where: { id, status: deal.status }, data: { status: next, updatedAt: new Date() } })
      await this.notify(tx, role === 'giver' ? deal.receiverId : deal.giverId, 'new_message', id, deal.itemId)
      return created
    })
    return toMessageDto(message, user.id)
  }

  // ───────────── Действия (кнопки из DealDetailsDto.actions) ─────────────

  async accept(id: number, user: AuthUser, dto: AcceptDealDto): Promise<DealDetailsDto> {
    const deal = await this.load(id, user)
    this.assertCan(deal, this.roleOf(deal, user), 'awaiting_handover')
    if (deal.item.status !== 'published') throw new ConflictException('Вещь уже зарезервирована или недоступна.')

    const meetingAt = dto.meetingAt ? new Date(dto.meetingAt) : null
    if (meetingAt && meetingAt <= new Date()) {
      throw new BadRequestException({ statusCode: 400, message: 'Время встречи должно быть в будущем.', field: 'meetingAt' })
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.move(tx, deal, 'awaiting_handover', { meetingAt, meetingNote: dto.meetingNote ?? null })
        const { count } = await tx.item.updateMany({
          where: { id: deal.itemId, status: 'published' },
          data: { status: 'reserved' },
        })
        if (count === 0) throw new ConflictException('Вещь уже зарезервирована или недоступна.')
        await this.system(tx, id, 'Автор подтвердил договорённость: вещь зарезервирована за вами.')
        await this.notify(tx, deal.receiverId, 'deal_status_changed', id, deal.itemId)
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Вещь уже зарезервирована другим человеком.')
      }
      throw e
    }
    return this.get(id, user)
  }

  async handover(id: number, user: AuthUser): Promise<DealDetailsDto> {
    const deal = await this.load(id, user)
    this.assertCan(deal, this.roleOf(deal, user), 'awaiting_receiver_confirmation')
    await this.prisma.$transaction(async (tx) => {
      await this.move(tx, deal, 'awaiting_receiver_confirmation', { handedOverAt: new Date() })
      await this.system(tx, id, 'Автор отметил, что передал вещь. Получатель, подтвердите получение.')
      await this.notify(tx, deal.receiverId, 'deal_status_changed', id, deal.itemId)
    })
    return this.get(id, user)
  }

  async confirm(id: number, user: AuthUser): Promise<DealDetailsDto> {
    const deal = await this.load(id, user)
    if (deal.status === 'completed') return this.get(id, user) 
    this.assertCan(deal, this.roleOf(deal, user), 'completed')

    await this.prisma.$transaction(async (tx) => {
      await this.move(tx, deal, 'completed', { completedAt: new Date() })
      await tx.item.updateMany({
        where: { id: deal.itemId, status: { in: ['reserved', 'published'] } },
        data: { status: 'transferred', closedAt: new Date() },
      })
      await this.createEcoRecord(tx, deal)
      await this.system(tx, id, 'Получатель подтвердил получение. Сделка завершена.')
      await this.notify(tx, deal.giverId, 'deal_status_changed', id, deal.itemId)
    })
    return this.get(id, user)
  }

  async cancel(id: number, user: AuthUser, dto: CancelDealDto): Promise<DealDetailsDto> {
    const deal = await this.load(id, user)
    if (deal.status === 'cancelled') return this.get(id, user)
    const role = this.roleOf(deal, user)
    this.assertCan(deal, role, 'cancelled')

    const wasReserved = deal.status === 'awaiting_handover' || deal.status === 'awaiting_receiver_confirmation'
    await this.prisma.$transaction(async (tx) => {
      await this.move(tx, deal, 'cancelled', {
        cancelledAt: new Date(),
        cancelledById: user.id,
        cancelReason: dto.reason,
        cancelComment: dto.comment ?? null,
      })
      if (wasReserved) {
        await tx.item.updateMany({ where: { id: deal.itemId, status: 'reserved' }, data: { status: 'published' } })
      }
      const who = role === 'giver' ? 'Автор' : 'Получатель'
      await this.system(tx, id, `${who} отменил(а) сделку: ${CANCEL_LABELS[dto.reason]}.`)
      await this.notify(tx, role === 'giver' ? deal.receiverId : deal.giverId, 'deal_status_changed', id, deal.itemId)
    })
    return this.get(id, user)
  }

  // ───────────── Вспомогательное ─────────────

  private async load(id: number, user: AuthUser): Promise<DealLoaded> {
    const deal = await this.prisma.deal.findUnique({ where: { id }, include: dealInclude })
    if (!deal || (deal.giverId !== user.id && deal.receiverId !== user.id)) {
      throw new NotFoundException('Сделка не найдена.')
    }
    return deal
  }

  private roleOf(deal: DealLoaded, user: AuthUser): DealRole {
    return deal.giverId === user.id ? 'giver' : 'receiver'
  }

  private assertCan(deal: DealLoaded, role: DealRole, to: DealStatus) {
    if (!canTransitionDeal(deal.status, to, role)) {
      throw new ConflictException('Сейчас это действие вам недоступно.')
    }
  }

  private async move(tx: Prisma.TransactionClient, deal: DealLoaded, to: DealStatus, data: Prisma.DealUncheckedUpdateManyInput = {}) {
    const { count } = await tx.deal.updateMany({ where: { id: deal.id, status: deal.status }, data: { status: to, ...data } })
    if (count === 0) throw changed()
  }

  private system(tx: Prisma.TransactionClient, dealId: number, body: string) {
    return tx.message.create({ data: { dealId, kind: 'system', body } })
  }

  private notify(tx: Prisma.TransactionClient, userId: number, type: NotificationType, dealId: number, itemId: number) {
    return tx.notification.create({ data: { userId, type, dealId, itemId } })
  }

  private findOpenDeal(itemId: number, receiverId: number) {
    return this.prisma.deal.findFirst({
      where: { itemId, receiverId, status: { in: OPEN_DEAL_STATUSES } },
      select: { id: true, status: true },
    })
  }

  private async createEcoRecord(tx: Prisma.TransactionClient, deal: DealLoaded) {
    const item = deal.item
    const coefficient = await tx.ecoCoefficient.findFirst({
      where: { categoryId: item.categoryId, validFrom: { lte: new Date() } },
      orderBy: { validFrom: 'desc' },
    })
    if (!coefficient) return
    const actual = item.weightKg !== null
    const massKg = actual ? item.weightKg! : coefficient.avgMassKg !== null ? item.quantity * coefficient.avgMassKg : null
    if (massKg === null) return 
    await tx.ecoRecord.create({
      data: {
        dealId: deal.id,
        userId: deal.giverId,
        categoryId: item.categoryId,
        coefficientId: coefficient.id,
        quantity: item.quantity,
        massKg,
        massSource: actual ? 'actual' : 'estimated',
        co2eKg: massKg * coefficient.co2PerKg,
      },
    })
  }
}