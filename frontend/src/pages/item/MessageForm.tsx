import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDeal } from '../../entities/deal/api'
import { MESSAGE_MAX } from '../../entities/deal/model'
import { Button } from '../../shared/ui/Button'

export function MessageForm({ itemId, onCancel }: { itemId: number; onCancel: () => void }) {
  const navigate = useNavigate()
  const fieldId = useId()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = body.trim()
    if (!text) {
      setError('Напишите сообщение автору.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const deal = await createDeal(itemId, text)
      navigate(`/deals/${deal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение. Попробуйте ещё раз.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="msgform">
      <div className="field">
        <label htmlFor={fieldId}>Сообщение автору</label>
        <textarea
          id={fieldId}
          name="message"
          autoFocus
          maxLength={MESSAGE_MAX}
          placeholder="Здравствуйте! Вещь ещё доступна? Когда можно забрать?"
          value={body}
          onChange={(e) => { setBody(e.target.value); setError('') }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-err` : undefined}
        />
        {error && <div id={`${fieldId}-err`} className="field__err" role="alert">{error}</div>}
        <div className="field__hint">Телефон и точный адрес лучше не писать: детали встречи согласуете в чате.</div>
      </div>
      <div className="msgform__actions">
        <Button type="submit" disabled={busy}>{busy ? 'Отправляем…' : 'Отправить'}</Button>
        <Button variant="outline" onClick={onCancel} disabled={busy}>Отмена</Button>
      </div>
    </form>
  )
}
