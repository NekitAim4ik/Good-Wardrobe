import { Link, useLocation } from 'react-router-dom'
import type { ItemDetails } from '../../entities/item/model'
import { useAuth } from '../../features/auth/AuthContext'
import { Button } from '../../shared/ui/Button'


export function ContactPanel({ item }: { item: ItemDetails }) {
  const { user } = useAuth()
  const location = useLocation()
  const { viewer } = item

  if (viewer.isOwner) {
    return <p className="contact__note">Это ваше объявление.</p>
  }

  if (viewer.activeDealId !== null) {
    return (
      <Link to={`/deals/${viewer.activeDealId}`} className="btn btn--primary contact__btn">
        Открыть диалог
      </Link>
    )
  }

  if (item.status !== 'published') {
    return <p className="contact__note">Написать автору сейчас нельзя.</p>
  }

  if (!user) {
    const state = { from: location.pathname }
    return (
      <>
        <Link to="/login" state={state} className="btn btn--primary contact__btn">
          Войдите, чтобы написать
        </Link>
        <p className="contact__note">
          Нет аккаунта? <Link to="/register" state={state}>Зарегистрируйтесь</Link>
        </p>
      </>
    )
  }

  return (
    <>
      <Button className="contact__btn" disabled={!viewer.canRequest} title="Переписка появится на следующем шаге">
        Написать автору
      </Button>
      <p className="contact__note">Переписка с автором появится в следующем обновлении.</p>
    </>
  )
}
