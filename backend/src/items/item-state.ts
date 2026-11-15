import { ItemStatus } from '@prisma/client'


export type ItemActor = 'owner' | 'system' | 'moderator'

export const ITEM_TRANSITIONS: Record<ItemStatus, Partial<Record<ItemStatus, ItemActor[]>>> = {
  published: {
    reserved: ['system'], 
    hidden: ['owner', 'moderator'],
    transferred: ['system'],
    rejected: ['moderator'],
  },
  reserved: {
    published: ['system'], 
    transferred: ['system'], 
  },
  hidden: {
    published: ['owner', 'moderator'],
    rejected: ['moderator'],
  },
  transferred: {}, 
  rejected: {}, 
}

export function canTransitionItem(from: ItemStatus, to: ItemStatus, actor: ItemActor): boolean {
  return ITEM_TRANSITIONS[from][to]?.includes(actor) ?? false
}

export const isItemOpenForRequests = (status: ItemStatus) => status === 'published'
