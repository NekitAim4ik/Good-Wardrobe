import { DealStatus } from '@prisma/client'


export type DealRole = 'giver' | 'receiver'
export type DealActor = DealRole | 'system' | 'moderator'

export type DealAction =
  | 'message' 
  | 'accept' 
  | 'handover' 
  | 'confirm' 
  | 'cancel' 
  | 'review' 
  | 'report' 

export const DEAL_TRANSITIONS: Record<DealStatus, Partial<Record<DealStatus, DealActor[]>>> = {
  requested: {
    negotiating: ['system'], 
    awaiting_handover: ['giver'],
    cancelled: ['giver', 'receiver'],
    in_review: ['system', 'moderator'],
  },
  negotiating: {
    awaiting_handover: ['giver'],
    cancelled: ['giver', 'receiver'],
    in_review: ['system', 'moderator'],
  },
  awaiting_handover: {
    awaiting_receiver_confirmation: ['giver'],
    cancelled: ['giver', 'receiver'],
    in_review: ['system', 'moderator'],
  },
  awaiting_receiver_confirmation: {
    completed: ['receiver'], 
    cancelled: ['giver', 'receiver'],
    in_review: ['system', 'moderator'], 
  },
  in_review: {
    completed: ['moderator'],
    cancelled: ['moderator'],
  },
  completed: {},
  cancelled: {},
}

export const OPEN_DEAL_STATUSES: DealStatus[] = [
  'requested', 'negotiating', 'awaiting_handover', 'awaiting_receiver_confirmation', 'in_review',
]

export function canTransitionDeal(from: DealStatus, to: DealStatus, actor: DealActor): boolean {
  return DEAL_TRANSITIONS[from][to]?.includes(actor) ?? false
}

const ACTION_FOR_TARGET: Partial<Record<DealStatus, DealAction>> = {
  awaiting_handover: 'accept',
  awaiting_receiver_confirmation: 'handover',
  completed: 'confirm',
  cancelled: 'cancel',
}

export function availableDealActions(status: DealStatus, role: DealRole, hasReviewed: boolean): DealAction[] {
  const actions: DealAction[] = []
  for (const [to, actors] of Object.entries(DEAL_TRANSITIONS[status]) as [DealStatus, DealActor[]][]) {
    const action = ACTION_FOR_TARGET[to]
    if (action && actors.includes(role)) actions.push(action)
  }
  if (OPEN_DEAL_STATUSES.includes(status)) actions.push('message')
  if (status === 'completed' && !hasReviewed) actions.push('review')
  actions.push('report')
  return actions
}
