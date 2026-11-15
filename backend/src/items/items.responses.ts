import { DealStatus, ItemCondition, ItemSource, ItemStatus, TransferFormat } from '@prisma/client'


export interface PublicUserDto {
  id: number
  name: string
  completedDeals: number
  memberSince: string 
}

export interface ItemCardDto {
  id: number
  title: string
  source: ItemSource
  status: ItemStatus
  category: { id: number; name: string }
  condition: ItemCondition
  transferFormat: TransferFormat
  district: { id: number; name: string }
  coverUrl: string | null
  publishedAt: string
}

export interface ItemDetailsDto extends ItemCardDto {
  description: string
  wantedInReturn: string | null
  quantity: number
  weightKg: number | null
  meetingNote: string | null
  photos: string[]
  owner: PublicUserDto
  viewer: {
    isOwner: boolean
    canRequest: boolean 
    activeDealId: number | null 
    activeDealStatus: DealStatus | null
  }
}
