import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { AuthUser } from '../auth/auth.types'
import { isItemOpenForRequests } from '../items/item-state'
import { PrismaService } from '../prisma/prisma.service'
import { OPEN_DEAL_STATUSES } from './deal-state'
import { CreateDealDto } from './dto/create-deal.dto'
import { DealCreatedDto } from './deals.responses'

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

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
        await tx.notification.create({
          data: { userId: item.ownerId, type: 'deal_requested', dealId: created.id, itemId: item.id },
        })
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

  private findOpenDeal(itemId: number, receiverId: number) {
    return this.prisma.deal.findFirst({
      where: { itemId, receiverId, status: { in: OPEN_DEAL_STATUSES } },
      select: { id: true, status: true },
    })
  }
}
