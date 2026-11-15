import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { getDeal, listMessages, sendMessage } from '../../entities/deal/api'
import { cancelReasonLabels, dealStatusLabels, type ChatMessage, type DealDetails } from '../../entities/deal/model'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime } from '../../shared/lib/date'
import { Header } from '../../widgets/header/Header'
import { Chat } from './Chat'
import { DealActions } from './DealActions'
import { DealSteps } from './DealSteps'
import './deal.css'

const POLL_MS = 5000

export function DealPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const location = useLocation()
  const dealId = Number(id)
  const validId = Number.isInteger(dealId) && dealId > 0

  const [deal, setDeal] = useState<DealDetails | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const lastId = useRef(0)

  const refresh = useCallback(async (initial = false) => {
    const [d, m] = await Promise.all([getDeal(dealId), listMessages(dealId, initial ? undefined : lastId.current)])
    setDeal(d)
    if (initial) setMessages(m)
    else if (m.length) setMessages((prev) => [...prev, ...m.filter((x) => !prev.some((p) => p.id === x.id))])
    if (m.length) lastId.current = Math.max(lastId.current, m[m.length - 1].id)
  }, [dealId])

  useEffect(() => {
    if (!user || !validId) return
    let alive = true
    lastId.current = 0
    setDeal(null)
    setMessages([])
    setError('')
    refresh(true).catch((e) => alive && setError(e instanceof Error ? e.message : 'Не удалось загрузить сделку.'))
    const timer = setInterval(() => { if (!document.hidden) refresh().catch(() => undefined) }, POLL_MS)
    return () => { alive = false; clearInterval(timer) }
  }, [dealId, user?.id, validId, refresh])

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  async function send(body: string) {
    const m = await sendMessage(dealId, body)
    setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]))
    lastId.current = Math.max(lastId.current, m.id)
    getDeal(dealId).then(setDeal).catch(() => undefined)
  }

  async function changed(d: DealDetails) {
    setDeal(d)
    await refresh().catch(() => undefined)
  }

  return (
    <>
      <Header />
      <main className="container dealpage">
        <Link to="/deals" className="itempage__back">← Все сделки</Link>

        {(error || !validId) && <div className="alert" role="alert">{error || 'Сделка не найдена.'}</div>}
        {!deal && !error && validId && <p className="muted" role="status">Загрузка…</p>}

        {deal && (
          <>
            <div className="dealpage__head card">
              <Link to={`/items/${deal.item.id}`} className="dealpage__thumb" aria-label="Открыть объявление">
                {deal.item.coverUrl ? <img src={deal.item.coverUrl} alt="" /> : <span aria-hidden="true">·</span>}
              </Link>
              <div>
                <h1 className="dealpage__title"><Link to={`/items/${deal.item.id}`}>{deal.item.title}</Link></h1>
                <p className="muted dealpage__who">
                  {deal.role === 'giver' ? 'Получатель' : 'Автор'}: {deal.counterpart.name}
                  {' · '}Завершённых обменов: {deal.counterpart.completedDeals}
                </p>
                <span className="tag">{dealStatusLabels[deal.status]}</span>
              </div>
            </div>

            <DealSteps status={deal.status} />

            <div className="dealpage__grid">
              <Chat messages={messages} canWrite={deal.actions.includes('message')} onSend={send} />

              <aside className="dealpage__side">
                <div className="card pad">
                  <DealActions deal={deal} onChanged={changed} />
                </div>

                {(deal.meetingNote || deal.meetingAt) && (
                  <div className="card pad">
                    <h3>Встреча</h3>
                    {deal.meetingNote && <p>{deal.meetingNote}</p>}
                    {deal.meetingAt && <p className="muted">{formatDateTime(deal.meetingAt)}</p>}
                  </div>
                )}

                {deal.cancel && (
                  <div className="card pad">
                    <h3>Сделка отменена</h3>
                    <p>{deal.cancel.byMe ? 'Вы отменили' : 'Собеседник отменил'}: {cancelReasonLabels[deal.cancel.reason].toLowerCase()}</p>
                    {deal.cancel.comment && <p className="muted">{deal.cancel.comment}</p>}
                  </div>
                )}

                {deal.eco && (
                  <div className="card pad eco">
                    <h3>Эффект для природы</h3>
                    <p className="eco__value">≈ {deal.eco.co2eKg} кг CO₂e</p>
                    <p className="muted">
                      Масса вещей: {deal.eco.massKg} кг{deal.eco.isEstimate ? ' (оценка по категории)' : ''}. CO₂e — расчётная
                      оценка потенциально предотвращённых выбросов, а не измерение.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </>
  )
}