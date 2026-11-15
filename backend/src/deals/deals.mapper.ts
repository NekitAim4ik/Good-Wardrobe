import { Message, Prisma } from '@prisma/client'
import { DealItemDto, MessageDto } from './deals.responses'

export const dealInclude = {
  item: {
    select: {
      id: true, title: true, status: true, ownerId: true,
      categoryId: true, quantity: true, weightKg: true,
      photos: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
    },
  },
  giver: { select: { id: true, name: true, createdAt: true } },
  receiver: { select: { id: true, name: true, createdAt: true } },
} satisfies Prisma.DealInclude

export type DealLoaded = Prisma.DealGetPayload<{ include: typeof dealInclude }>

export const toItemDto = (item: DealLoaded['item']): DealItemDto => ({
  id: item.id,
  title: item.title,
  coverUrl: item.photos[0]?.url ?? null,
  status: item.status,
})

export const toMessageDto = (m: Message, viewerId: number): MessageDto => ({
  id: m.id,
  kind: m.kind,
  senderId: m.senderId,
  isMine: m.senderId === viewerId,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
})

export const round2 = (n: number) => Math.round(n * 100) / 100
