import { useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { Icon } from '../../shared/ui/Icon'

export function Hero() {
  const [noPhoto, setNoPhoto] = useState(false)
  return (
    <section className="container hero">
      <div className="hero__text">
        <span className="pill">Хорошим вещам — новая жизнь</span>
        <h1>Освободите место. Поделитесь добром.</h1>
        <p>Отдавайте то, чем больше не пользуетесь, и находите нужное рядом. В районном шкафу или прямо у соседей — бесплатно.</p>
        <div className="hero__cta">
          <Button icon="pin">Найти шкаф</Button>
          <Button variant="outline" icon="plus">Отдать вещь</Button>
        </div>
        <small className="muted">Без оплаты за вещи · С заботой о людях и природе</small>
      </div>
      <div className="hero__media">
        {noPhoto
          ? <div className="hero__ph" role="img" aria-label="Здесь будет фото" />
          : <img src="/images/hero.jpg" alt="Две соседки передают друг другу вещи" onError={() => setNoPhoto(true)} />}
        <div className="hero__badge">
          <span className="hero__badge-ic"><Icon name="repeat" size={18} /></span>
          <div><strong>Не нужно вам. Нужно кому-то.</strong><br /><small className="muted">Один район — много добрых встреч</small></div>
        </div>
      </div>
    </section>
  )
}
