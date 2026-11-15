import { http } from '../../shared/api/http'
import type { DealCreated } from './model'

export const createDeal = (itemId: number, message: string) =>
  http<DealCreated>('/deals', { method: 'POST', body: { itemId, message } })
