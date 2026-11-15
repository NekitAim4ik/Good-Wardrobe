import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { listDeals } from '../../entities/deal/api'
import { dealStatusLabels, type DealRole, type DealSummary } from '../../entities/deal/model'
import { useAuth } from '../../features/auth/AuthContext'
import { formatShort } from '../../shared/lib/date'
import { Header } from '../../widgets/header/Header'
import '../deal/deal.css'
import '../item/item.css'

const TABS: { label: string; role?: DealRole }[] = [
  { label: 'Все' },
  { label: 'Я отдаю', role: 'giver' },
  { label: 'Я получаю', role: 'receiver' },
]

export function DealsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [role, setRole] = useState<DealRole | undefined>()
  const [deals, setDeals] = useState<DealSummary[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let alive = true
    setDeals(null)
    setError('')
    listDeals({ role })
      .then((page) => alive && setDeals(page.items))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Не удалось загрузить сделки.'))
    return () => { alive = false }
  }, [role, user?.id])

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  return (
    <>
      <Header />
      <main className="container dealpage">
        <h1 style={{ fontSize: 28 }}>Чаты и сделки</h1>

        <div className="deals__tabs" role="group" aria-label="Фильтр сделок">
          {TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              className="deals__tab"
              aria-current={t.role === role ? 'true' : undefined}
              onClick={() => setRole(t.role)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="alert" role="alert">{error}</div>}
        {!deals && !error && <p className="muted" role="status">Загрузка…</p>}
        {deals && deals.length === 0 && (
          <p className="muted">Сделок пока нет. Найдите вещь в каталоге и напишите автору.</p>
        )}

        {deals && deals.length > 0 && (
          <ul className="deals__list">
            {deals.map((d) => (
              <li key={d.id}>
                <Link to={`/deals/${d.id}`} className="card deals__row">
                  <span className="dealpage__thumb">
                    {d.item.coverUrl ? <img src={d.item.coverUrl} alt="" /> : <span aria-hidden="true">·</span>}
                  </span>
                  <span className="deals__body">
                    <span className="deals__top">
                      <span className="deals__title">{d.item.title}</span>
                      <span className="deals__time">{formatShort(d.updatedAt)}</span>
                    </span>
                    <span className="deals__meta" style={{ display: 'block' }}>
                      {d.role === 'giver' ? 'Получатель' : 'Автор'}: {d.counterpart.name} · {dealStatusLabels[d.status]}
                    </span>
                    {d.lastMessage && (
                      <span className="deals__last" style={{ display: 'block' }}>
                        {d.lastMessage.body}
                      </span>
                    )}
                  </span>
                  {d.unreadCount > 0 && <span className="deals__badge" aria-label={`Непрочитанных: ${d.unreadCount}`}>{d.unreadCount}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
