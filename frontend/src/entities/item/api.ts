import { http } from '../../shared/api/http'
import type { Item, ItemDetails, NewItemInput, UploadedPhoto } from './model'

const mock: Item[] = [
  { id: 1, title: 'Свитер, размер M', source: 'direct', distanceKm: 0.8, note: 'Хорошее состояние · Москва' },
  { id: 2, title: 'Набор детских книг', source: 'point', sourceName: 'Соседский', distanceKm: 1.2, note: 'Выдача по правилам пункта' },
  { id: 3, title: 'Кроссовки, размер 37', source: 'direct', distanceKm: 1.5, note: 'Чистые, без повреждений' },
  { id: 4, title: 'Набор посуды', source: 'point', sourceName: 'У дома', distanceKm: 2.1, note: 'Комплект на две персоны' },
]

export async function getNearbyItems(): Promise<Item[]> {
  return mock
}

export const getItem = (id: number) => http<ItemDetails>(`/items/${id}`)

export const createItem = (data: NewItemInput) => http<ItemDetails>('/items', { method: 'POST', body: data })

export function uploadPhoto(file: File) {
  const form = new FormData()
  form.append('file', file)
  return http<UploadedPhoto>('/uploads', { method: 'POST', body: form })
}