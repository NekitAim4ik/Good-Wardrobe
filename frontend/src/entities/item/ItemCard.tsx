import { Button } from '../../shared/ui/Button'
import type { Item } from './model'

const km = (v: number) => `${v.toString().replace('.', ',')} км`

export function ItemCard({ item }: { item: Item }) {
  const where = item.source === 'direct' ? 'Напрямую' : `Пункт «${item.sourceName}»`
  return (
    <article className="card item">
      <div className="item__img">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span>Фото</span>}
      </div>
      <div className="item__body">
        <span className="tag">Доступно</span>
        <h3>{item.title}</h3>
        <p>{where} · {km(item.distanceKm)}</p>
        <p className="muted">{item.note}</p>
        <Button variant="outline">Подробнее</Button>
      </div>
    </article>
  )
}
