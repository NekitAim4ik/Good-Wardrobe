import type { Category } from '../../entities/catalog/model'
import { ITEM_LIMITS as L, type ItemCondition, type TransferFormat } from '../../entities/item/model'

export interface ItemFormValues {
  title: string
  categoryId: string 
  condition: ItemCondition
  transferFormat: TransferFormat
  wantedInReturn: string
  description: string
  quantity: string
  weight: string
  districtId: string
  meetingNote: string
}

export type ItemFormErrors = Partial<Record<keyof ItemFormValues | 'photos', string>>

export const FIELD_ORDER = [
  'photos', 'title', 'categoryId', 'wantedInReturn', 'description', 'quantity', 'weight', 'districtId', 'meetingNote',
] as const

export function parseWeight(v: string): number | null {
  const t = v.trim().replace(',', '.')
  return t === '' ? null : Number(t)
}

export function validateItem(
  v: ItemFormValues,
  photos: { ready: number; uploading: boolean },
  category: Category | undefined,
): ItemFormErrors {
  const e: ItemFormErrors = {}
  const title = v.title.trim()
  if (title.length < L.titleMin) e.title = `Название — не короче ${L.titleMin} символов.`
  else if (title.length > L.titleMax) e.title = `Название — не длиннее ${L.titleMax} символов.`

  if (!category) e.categoryId = 'Выберите категорию.'

  if (v.transferFormat === 'exchange' && !v.wantedInReturn.trim()) e.wantedInReturn = 'Напишите, что хотите получить взамен.'

  const description = v.description.trim()
  if (description.length < L.descriptionMin) e.description = `Опишите вещь подробнее — не короче ${L.descriptionMin} символов.`

  const q = v.quantity.trim()
  if (!/^\d+$/.test(q) || Number(q) < 1 || Number(q) > L.quantityMax) e.quantity = `Количество — целое число от 1 до ${L.quantityMax}.`

  const weight = v.weight.trim()
  if (weight === '') {
    if (category?.requiresWeight) e.weight = 'Для этой категории укажите вес вещей.'
  } else if (!/^\d+([.,]\d{1,3})?$/.test(weight) || Number(weight.replace(',', '.')) <= 0) {
    e.weight = 'Вес — число больше нуля, например 1,5.'
  } else if (Number(weight.replace(',', '.')) > L.weightMaxKg) {
    e.weight = `Вес — не больше ${L.weightMaxKg} кг.`
  }

  if (!v.districtId) e.districtId = 'Выберите район.'

  if (photos.uploading) e.photos = 'Дождитесь окончания загрузки фотографий.'
  else if (photos.ready < L.photosMin) e.photos = 'Добавьте хотя бы одну фотографию.'

  return e
}
