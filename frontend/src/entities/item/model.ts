export type ItemSource = 'direct' | 'point'

export interface Item {
  id: number
  title: string
  source: ItemSource
  sourceName?: string 
  distanceKm: number
  note: string
  imageUrl?: string
}

export type ItemStatus = 'published' | 'reserved' | 'transferred' | 'hidden' | 'rejected'
export type ItemCondition = 'brand_new' | 'excellent' | 'good' | 'fair'
export type TransferFormat = 'gift' | 'exchange'

export interface PublicUser {
  id: number
  name: string
  completedDeals: number
  memberSince: string 
}

export interface ItemDetails {
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
  description: string
  wantedInReturn: string | null
  quantity: number
  weightKg: number | null
  meetingNote: string | null
  photos: string[]
  owner: PublicUser
  viewer: {
    isOwner: boolean
    canRequest: boolean
    activeDealId: number | null
    activeDealStatus: string | null
  }
}

export const conditionLabels: Record<ItemCondition, string> = {
  brand_new: 'Новое',
  excellent: 'Отличное',
  good: 'Хорошее',
  fair: 'Удовлетворительное',
}

export const formatLabels: Record<TransferFormat, string> = {
  gift: 'Отдам даром',
  exchange: 'Обмен',
}

export const statusNotices: Partial<Record<ItemStatus, string>> = {
  reserved: 'Вещь зарезервирована: автор уже договорился с другим человеком.',
  transferred: 'Эту вещь уже передали новому владельцу.',
  hidden: 'Объявление скрыто — его видите только вы.',
  rejected: 'Объявление отклонено модератором и не показывается в каталоге.',
}