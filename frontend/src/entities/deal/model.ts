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
