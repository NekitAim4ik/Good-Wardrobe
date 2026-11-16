import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { useGiveItem } from '../../features/give-item/useGiveItem'
import { Button } from '../../shared/ui/Button'
import { Icon } from '../../shared/ui/Icon'
import { Logo } from '../../shared/ui/Logo'
import { UserMenu } from './UserMenu'

const nav = [
  { label: 'Вещи рядом', href: '#nearby' },
  { label: 'Карта шкафов', href: '#' },
  { label: 'Как это работает', href: '#how' },
  { label: 'База знаний', href: '#' },
]

export function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const giveItem = useGiveItem()
  return (
    <header className="header">
      <div className="container header__in">
        <Logo />
        <nav className="header__nav" aria-label="Основная навигация">
          {nav.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="header__actions">
          <Button icon="plus" onClick={giveItem}>Отдать вещь</Button>
          {user ? (
            <>
              <button type="button" className="icon-btn" aria-label="Уведомления"><Icon name="bell" size={18} /></button>
              <UserMenu />
            </>
          ) : (
            <Button variant="outline" onClick={() => navigate('/login')}>Войти</Button>
          )}
        </div>
      </div>
    </header>
  )
}