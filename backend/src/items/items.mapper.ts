import { Prisma } from '@prisma/client'
import { ItemCardDto, ItemDetailsDto, PublicUserDto } from './items.responses'

export const cardInclude = {
  category: { select: { id: true, name: true } },
  district: { select: { id: true, name: true } },
  photos: { orderBy: { position: 'asc' }, take: 1 },
} satisfies Prisma.ItemInclude

export const detailsInclude = {
  category: { select: { id: true, name: true } },
  district: { select: { id: true, name: true } },
  photos: { orderBy: { position: 'asc' } },
  owner: { select: { id: true, name: true, createdAt: true } },
} satisfies Prisma.ItemInclude

export type ItemWithCard = Prisma.ItemGetPayload<{ include: typeof cardInclude }>
export type ItemWithDetails = Prisma.ItemGetPayload<{ include: typeof detailsInclude }>

export function toCard(item: ItemWithCard | ItemWithDetails): ItemCardDto {
  return {
    id: item.id,
    title: item.title,
    source: item.source,
    status: item.status,
    category: item.category,
    condition: item.condition,
    transferFormat: item.transferFormat,
    district: item.district,
    coverUrl: item.photos[0]?.url ?? null,
    publishedAt: item.publishedAt.toISOString(),
  }
}

export function toPublicUser(owner: ItemWithDetails['owner'], completedDeals: number): PublicUserDto {
  return { id: owner.id, name: owner.name, completedDeals, memberSince: owner.createdAt.toISOString() }
}

export function toDetails(
  item: ItemWithDetails,
  owner: PublicUserDto,
  viewer: ItemDetailsDto['viewer'],
): ItemDetailsDto {
  return {
    ...toCard(item),
    description: item.description,
    wantedInReturn: item.wantedInReturn,
    quantity: item.quantity,
    weightKg: item.weightKg,
    meetingNote: item.meetingNote,
    photos: item.photos.map((p) => p.url),
    owner,
    viewer,
  }
}
