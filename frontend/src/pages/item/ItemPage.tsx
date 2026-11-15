import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getItem } from '../../entities/item/api'
import { conditionLabels, formatLabels, statusNotices, type ItemDetails } from '../../entities/item/model'
import { initials } from '../../entities/user/model'
import { useAuth } from '../../features/auth/AuthContext'
import { Header } from '../../widgets/header/Header'
import { ContactPanel } from './ContactPanel'
import { Gallery } from './Gallery'
import './item.css'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; item: ItemDetails }

const fullDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const monthYear = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

export function ItemPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const itemId = Number(id)
    if (!Number.isInteger(itemId) || itemId < 1) {
      setState({ status: 'error', message: 'Объявление не найдено.' })
      return
    }
    let alive = true
    setState({ status: 'loading' })
    getItem(itemId)
      .then((item) => alive && setState({ status: 'ready', item }))
      .catch((e) => alive && setState({ status: 'error', message: e instanceof Error ? e.message : 'Не удалось загрузить объявление.' }))
    return () => { alive = false }
  }, [id, user?.id])

  useEffect(() => {
    if (state.status !== 'ready') return
    document.title = `${state.item.title} — Добрый Шкаф`
    return () => { document.title = 'Добрый Шкаф' }
  }, [state])

  return (
    <>
      <Header />
      <main className="container itempage">
        <Link to="/" className="itempage__back">← На главную</Link>

        {state.status === 'loading' && <p className="muted" role="status">Загрузка…</p>}

        {state.status === 'error' && (
          <div className="itempage__empty" role="alert">
            <h1>{state.message}</h1>
            <p className="muted">Возможно, объявление удалено или ссылка введена с ошибкой.</p>
            <Link to="/" className="btn btn--outline">Вернуться на главную</Link>
          </div>
        )}

        {state.status === 'ready' && <ItemView item={state.item} />}
      </main>
    </>
  )
}

function ItemView({ item }: { item: ItemDetails }) {
  const notice = statusNotices[item.status]

  return (
    <>
      {notice && <div className="alert" role="status">{notice}</div>}

      <div className="itempage__grid">
        <div>
          <Gallery key={item.id} photos={item.photos} title={item.title} />

          <section className="itempage__block">
            <h2>Описание</h2>
            <p className="itempage__text">{item.description}</p>
          </section>

          {item.wantedInReturn && (
            <section className="itempage__block">
              <h2>Хочу взамен</h2>
              <p className="itempage__text">{item.wantedInReturn}</p>
            </section>
          )}

          {item.meetingNote && (
            <section className="itempage__block">
              <h2>Где встретиться</h2>
              <p className="itempage__text">{item.meetingNote}</p>
              <p className="muted">Точное место автор согласует с вами в переписке.</p>
            </section>
          )}
        </div>

        <aside className="itempage__side">
          <div className="card pad">
            <div className="itempage__tags">
              <span className="tag">{item.category.name}</span>
              <span className="tag">{formatLabels[item.transferFormat]}</span>
            </div>
            <h1 className="itempage__title">{item.title}</h1>

            <dl className="facts">
              <dt>Состояние</dt><dd>{conditionLabels[item.condition]}</dd>
              <dt>Район</dt><dd>{item.district.name}</dd>
              {item.quantity > 1 && (<><dt>Количество</dt><dd>{item.quantity} шт.</dd></>)}
              {item.weightKg !== null && (<><dt>Вес</dt><dd>{item.weightKg} кг</dd></>)}
              <dt>Опубликовано</dt><dd>{fullDate(item.publishedAt)}</dd>
            </dl>

            <div className="contact">
              <ContactPanel item={item} />
            </div>
          </div>

          <div className="card pad owner">
            <div className="avatar owner__avatar" aria-hidden="true">{initials(item.owner.name)}</div>
            <div>
              <strong>{item.owner.name}</strong>
              <p className="muted owner__meta">
                На платформе с {monthYear(item.owner.memberSince)}
                <br />
                Завершённых обменов: {item.owner.completedDeals}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
