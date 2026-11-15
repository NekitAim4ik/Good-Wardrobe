import { http } from '../../shared/api/http'
import type { Page } from '../../shared/api/types'
import type { CancelReason, ChatMessage, DealCreated, DealDetails, DealRole, DealStatus, DealSummary } from './model'

export const createDeal = (itemId: number, message: string) =>
  http<DealCreated>('/deals', { method: 'POST', body: { itemId, message } })

export function listDeals(params: { role?: DealRole; status?: DealStatus; page?: number } = {}) {
  const q = new URLSearchParams()
  if (params.role) q.set('role', params.role)
  if (params.status) q.set('status', params.status)
  if (params.page) q.set('page', String(params.page))
  const qs = q.toString()
  return http<Page<DealSummary>>(`/deals${qs ? `?${qs}` : ''}`)
}

export const getDeal = (id: number) => http<DealDetails>(`/deals/${id}`)

export const listMessages = (id: number, after?: number) =>
  http<ChatMessage[]>(`/deals/${id}/messages${after ? `?after=${after}` : ''}`)

export const sendMessage = (id: number, body: string) =>
  http<ChatMessage>(`/deals/${id}/messages`, { method: 'POST', body: { body } })

export const acceptDeal = (id: number, data: { meetingAt?: string; meetingNote?: string }) =>
  http<DealDetails>(`/deals/${id}/accept`, { method: 'POST', body: data })
export const handoverDeal = (id: number) => http<DealDetails>(`/deals/${id}/handover`, { method: 'POST' })
export const confirmDeal = (id: number) => http<DealDetails>(`/deals/${id}/confirm`, { method: 'POST' })
export const cancelDeal = (id: number, data: { reason: CancelReason; comment?: string }) =>
  http<DealDetails>(`/deals/${id}/cancel`, { method: 'POST', body: data })