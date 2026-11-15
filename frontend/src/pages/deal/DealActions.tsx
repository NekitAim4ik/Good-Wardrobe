import { useId, useState, type FormEvent } from 'react'
import { acceptDeal, cancelDeal, confirmDeal, handoverDeal } from '../../entities/deal/api'
import { cancelReasonLabels, type CancelReason, type DealDetails } from '../../entities/deal/model'
import { Button } from '../../shared/ui/Button'

type Mode = null | 'accept' | 'cancel'

export function DealActions({ deal, onChanged }: { deal: DealDetails; onChanged: (d: DealDetails) => void }) {
  const [mode, setMode] = useState<Mode>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const has = (a: DealDetails['actions'][number]) => deal.actions.includes(a)

  async function run(fn: () => Promise<DealDetails>) {
    setBusy(true)
    setError('')
    try {
      onChanged(await fn())
      setMode(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить действие.')
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'accept') {
    return <AcceptForm busy={busy} error={error} onCancel={() => { setMode(null); setError('') }}
      onSubmit={(data) => run(() => acceptDeal(deal.id, data))} />
  }
  if (mode === 'cancel') {
    return <CancelForm busy={busy} error={error} onBack={() => { setMode(null); setError('') }}
      onSubmit={(data) => run(() => cancelDeal(deal.id, data))} />
  }

  const waiting =
    deal.status === 'awaiting_handover' && deal.role === 'receiver' ? 'Ждём, когда автор отметит передачу вещи.'
    : deal.status === 'awaiting_receiver_confirmation' && deal.role === 'giver' ? 'Ждём, когда получатель подтвердит получение.'
    : (deal.status === 'requested' || deal.status === 'negotiating') && deal.role === 'receiver'
      ? 'Договоритесь с автором в чате. Когда всё решите, автор нажмёт «Договорились».'
    : null

  return (
    <div className="actions">
      {has('accept') && <Button className="actions__btn" onClick={() => setMode('accept')}>Договорились</Button>}
      {has('handover') && (
        <Button className="actions__btn" disabled={busy} onClick={() => run(() => handoverDeal(deal.id))}>
          Я передал(а) вещь
        </Button>
      )}
      {has('confirm') && (
        <Button className="actions__btn" disabled={busy} onClick={() => run(() => confirmDeal(deal.id))}>
          Я получил(а) вещь
        </Button>
      )}
      {has('cancel') && (
        <Button variant="outline" className="actions__btn" onClick={() => setMode('cancel')}>Отменить сделку</Button>
      )}
      {waiting && <p className="muted actions__note">{waiting}</p>}
      {deal.status === 'completed' && has('review') && (
        <p className="muted actions__note">Отзыв о сделке можно будет оставить на следующем шаге.</p>
      )}
      {error && <div className="field__err" role="alert">{error}</div>}
    </div>
  )
}

function AcceptForm(props: { busy: boolean; error: string; onCancel: () => void; onSubmit: (d: { meetingAt?: string; meetingNote?: string }) => void }) {
  const noteId = useId()
  const atId = useId()
  const [note, setNote] = useState('')
  const [at, setAt] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    props.onSubmit({
      meetingNote: note.trim() || undefined,
      meetingAt: at ? new Date(at).toISOString() : undefined,
    })
  }
  return (
    <form onSubmit={submit} className="actions" noValidate>
      <p className="actions__note">Вещь будет зарезервирована за этим человеком. Место и время можно указать сейчас или позже в чате.</p>
      <div className="field">
        <label htmlFor={noteId}>Где встретиться</label>
        <input id={noteId} maxLength={300} placeholder="Например, у входа в метро" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={atId}>Когда</label>
        <input id={atId} type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      </div>
      {props.error && <div className="field__err" role="alert">{props.error}</div>}
      <div className="msgform__actions">
        <Button type="submit" disabled={props.busy}>Подтвердить</Button>
        <Button variant="outline" onClick={props.onCancel} disabled={props.busy}>Назад</Button>
      </div>
    </form>
  )
}

function CancelForm(props: { busy: boolean; error: string; onBack: () => void; onSubmit: (d: { reason: CancelReason; comment?: string }) => void }) {
  const reasonId = useId()
  const commentId = useId()
  const [reason, setReason] = useState<CancelReason>('changed_mind')
  const [comment, setComment] = useState('')
  const [localError, setLocalError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (reason === 'other' && !comment.trim()) {
      setLocalError('Опишите причину отмены.')
      return
    }
    setLocalError('')
    props.onSubmit({ reason, comment: comment.trim() || undefined })
  }
  const error = localError || props.error
  return (
    <form onSubmit={submit} className="actions" noValidate>
      <div className="field">
        <label htmlFor={reasonId}>Причина отмены</label>
        <select id={reasonId} value={reason} onChange={(e) => setReason(e.target.value as CancelReason)}>
          {(Object.keys(cancelReasonLabels) as CancelReason[]).map((r) => (
            <option key={r} value={r}>{cancelReasonLabels[r]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={commentId}>Комментарий{reason === 'other' ? '' : ' (необязательно)'}</label>
        <textarea id={commentId} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {error && <div className="field__err" role="alert">{error}</div>}
      <div className="msgform__actions">
        <Button type="submit" disabled={props.busy}>Отменить сделку</Button>
        <Button variant="outline" onClick={props.onBack} disabled={props.busy}>Назад</Button>
      </div>
    </form>
  )
}
