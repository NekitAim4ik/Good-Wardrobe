export type ItemSource = 'direct' | 'point'

export interface Item {
  id: number
  title: string
  source: ItemSource
  sourceName?: string // название пункта, если source === 'point'
  distanceKm: number
  note: string
  imageUrl?: string
}
