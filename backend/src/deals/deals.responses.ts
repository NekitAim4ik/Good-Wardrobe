import { CancelReason, DealStatus, ItemStatus, MessageKind, WeightSource } from '@prisma/client'
import { PublicUserDto } from '../items/items.responses'
import { DealAction, DealRole } from './deal-state'

export interface DealItemDto {
  id: number
  title: string
  coverUrl: string | null
  status: ItemStatus
}

export interface MessageDto {
  id: number
  kind: MessageKind
  senderId: number | null 
  isMine: boolean
  body: string
  createdAt: string
}

export interface DealSummaryDto {
  id: number
  status: DealStatus
  role: DealRole
  item: DealItemDto
  counterpart: PublicUserDto
  lastMessage: Pick<MessageDto, 'kind' | 'body' | 'createdAt'> | null
  unreadCount: number
  updatedAt: string
}

export interface ReviewDto {
  id: number
  rating: number
  text: string | null
  authorName: string
  createdAt: string
}

export interface EcoResultDto {
  massKg: number
  massSource: WeightSource
  isEstimate: boolean
  co2eKg: number
  categoryName: string
}

export interface DealDetailsDto {
  id: number
  status: DealStatus
  role: DealRole
  item: DealItemDto
  counterpart: PublicUserDto
  meetingAt: string | null
  meetingNote: string | null
  handedOverAt: string | null
  completedAt: string | null
  cancel: { reason: CancelReason; comment: string | null; byMe: boolean; at: string } | null
  actions: DealAction[] 
  myReview: ReviewDto | null
  counterpartReview: ReviewDto | null 
  eco: EcoResultDto | null
  pointsDelta: number | null 
}
