import { Button } from '../../shared/ui/Button'
import { Icon } from '../../shared/ui/Icon'
import { Logo } from '../../shared/ui/Logo'

const nav = [
  { label: 'Вещи рядом', href: '#nearby' },
  { label: 'Карта шкафов', href: '#' },
  { label: 'Как это работает', href: '#how' },
  { label: 'База знаний', href: '#' },
]

export function Header() {
  return (
    <header className="header">
      <div className="container header__in">
        <Logo />
        <nav className="header__nav" aria-label="Основная навигация">
          {nav.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="header__actions">
          <Button icon="plus">Отдать вещь</Button>
          <button type="button" className="icon-btn" aria-label="Уведомления"><Icon name="bell" size={18} /></button>
          <button type="button" className="avatar" aria-label="Личный кабинет">АС</button>
        </div>
      </div>
    </header>
  )
}
