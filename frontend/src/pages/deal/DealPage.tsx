import { Link, useParams } from 'react-router-dom'
import { Header } from '../../widgets/header/Header'

export function DealPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <>
      <Header />
      <main className="container" style={{ padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 10 }}>Сообщение отправлено</h1>
        <p className="muted">
          Сделка № {id} создана, автор получит ваше сообщение. Переписка и статус сделки появятся на следующем шаге.
        </p>
        <Link to="/" className="btn btn--outline" style={{ textDecoration: 'none', marginTop: 12 }}>
          На главную
        </Link>
      </main>
    </>
  )
}
