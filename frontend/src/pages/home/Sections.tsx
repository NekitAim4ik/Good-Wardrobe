import { useEffect, useState } from 'react'
import { ItemCard } from '../../entities/item/ItemCard'
import { getNearbyItems } from '../../entities/item/api'
import type { Item } from '../../entities/item/model'
import { Button } from '../../shared/ui/Button'
import { Icon, type IconName } from '../../shared/ui/Icon'

const perks: { icon: IconName; text: string }[] = [
  { icon: 'shelf', text: 'Пункты приёма в вашем районе' },
  { icon: 'chat', text: 'Прямой обмен с соседями' },
  { icon: 'heart', text: 'Поддержка семей без лишних барьеров' },
]

export function Perks() {
  return (
    <section className="container perks">
      {perks.map((p) => <div key={p.text}><Icon name={p.icon} size={18} />{p.text}</div>)}
    </section>
  )
}

export function TwoWays() {
  return (
    <section id="how" className="container section">
      <h2>Два способа — одна цель</h2>
      <div className="grid-2">
        <div className="card pad">
          <h3>Через офлайн-пункт</h3>
          <p>Найдите ближайший «Добрый шкаф», проверьте правила и принесите вещи. Волонтёр примет их, а вы сможете подобрать другие вещи по условиям пункта.</p>
          <p className="muted">Приём подтверждает сотрудник пункта.</p>
          <Button variant="outline">Пункты на карте</Button>
        </div>
        <div className="card pad">
          <h3>Напрямую между людьми</h3>
          <p>Разместите объявление, ответьте соседу в чате и согласуйте встречу. Передайте вещь лично, затем подтвердите передачу с обеих сторон.</p>
          <p className="muted">Без отправки вещей на склад платформы.</p>
          <Button variant="outline">Создать объявление</Button>
        </div>
      </div>
    </section>
  )
}

export function Nearby() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => { getNearbyItems().then(setItems) }, [])
  return (
    <section id="nearby" className="container section">
      <div className="section__head">
        <h2>Вещи рядом с вами</h2>
        <span className="muted"><a href="#">Все вещи</a> · <a href="#">На карте</a></span>
      </div>
      <div className="grid-4">{items.map((i) => <ItemCard key={i.id} item={i} />)}</div>
    </section>
  )
}
