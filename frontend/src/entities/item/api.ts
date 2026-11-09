import type { Item } from './model'

const mock: Item[] = [
  { id: 1, title: 'Свитер, размер M', source: 'direct', distanceKm: 0.8, note: 'Хорошее состояние · Москва' },
  { id: 2, title: 'Набор детских книг', source: 'point', sourceName: 'Соседский', distanceKm: 1.2, note: 'Выдача по правилам пункта' },
  { id: 3, title: 'Кроссовки, размер 37', source: 'direct', distanceKm: 1.5, note: 'Чистые, без повреждений' },
  { id: 4, title: 'Набор посуды', source: 'point', sourceName: 'У дома', distanceKm: 2.1, note: 'Комплект на две персоны' },
]

// Позже заменить на: fetch('/api/items?near=...').then(r => r.json())
export async function getNearbyItems(): Promise<Item[]> {
  return mock
}
