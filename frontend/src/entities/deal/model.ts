export type DealStatus =
  | 'requested'
  | 'negotiating'
  | 'awaiting_handover'
  | 'awaiting_receiver_confirmation'
  | 'completed'
  | 'cancelled'
  | 'in_review'

export interface DealCreated {
  id: number
  status: DealStatus
  created: boolean 
}

export const MESSAGE_MAX = 2000

export type DealRole = 'giver' | 'receiver'
export type DealAction = 'message' | 'accept' | 'handover' | 'confirm' | 'cancel' | 'review' | 'report'
export type CancelReason = 'changed_mind' | 'no_response' | 'item_unavailable' | 'no_show' | 'other'

export interface DealItem {
  id: number
  title: string
  coverUrl: string | null
  status: string
}

export interface ChatMessage {
  id: number
  kind: 'text' | 'system'
  senderId: number | null
  isMine: boolean
  body: string
  createdAt: string
}

export interface DealSummary {
  id: number
  status: DealStatus
  role: DealRole
  item: DealItem
  counterpart: { id: number; name: string }
  lastMessage: { kind: 'text' | 'system'; body: string; createdAt: string } | null
  unreadCount: number
  updatedAt: string
}

export interface Review {
  id: number
  rating: number
  text: string | null
  authorName: string
  createdAt: string
}

export interface EcoResult {
  massKg: number
  massSource: 'actual' | 'estimated'
  isEstimate: boolean
  co2eKg: number
  categoryName: string
}

export interface DealDetails {
  id: number
  status: DealStatus
  role: DealRole
  item: DealItem
  counterpart: { id: number; name: string; completedDeals: number; memberSince: string }
  meetingAt: string | null
  meetingNote: string | null
  handedOverAt: string | null
  completedAt: string | null
  cancel: { reason: CancelReason; comment: string | null; byMe: boolean; at: string } | null
  actions: DealAction[] 
  myReview: Review | null
  counterpartReview: Review | null
  eco: EcoResult | null
  pointsDelta: number | null
}

export const dealStatusLabels: Record<DealStatus, string> = {
  requested: 'Запрос отправлен',
  negotiating: 'Согласование',
  awaiting_handover: 'Ожидается передача',
  awaiting_receiver_confirmation: 'Ждём подтверждения получателя',
  completed: 'Завершена',
  cancelled: 'Отменена',
  in_review: 'На рассмотрении',
}

export const DEAL_STEPS: { status: DealStatus; label: string }[] = [
  { status: 'requested', label: 'Запрос' },
  { status: 'negotiating', label: 'Согласование' },
  { status: 'awaiting_handover', label: 'Передача' },
  { status: 'awaiting_receiver_confirmation', label: 'Подтверждение' },
  { status: 'completed', label: 'Готово' },
]

export const cancelReasonLabels: Record<CancelReason, string> = {
  changed_mind: 'Передумал(а)',
  no_response: 'Нет ответа',
  item_unavailable: 'Вещь больше недоступна',
  no_show: 'Не удалось встретиться',
  other: 'Другая причина',
}