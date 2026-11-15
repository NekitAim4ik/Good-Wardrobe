import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { MESSAGE_MAX, type ChatMessage } from '../../entities/deal/model'
import { formatTime } from '../../shared/lib/date'
import { Button } from '../../shared/ui/Button'

interface Props {
  messages: ChatMessage[]
  canWrite: boolean
  onSend: (body: string) => Promise<void>
}

export function Chat({ messages, canWrite, onSend }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const fieldId = useId()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await onSend(text)
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="chat">
      <div className="chat__list" ref={listRef} role="log" aria-live="polite" aria-label="Переписка">
        {messages.length === 0 && <p className="muted chat__empty">Сообщений пока нет.</p>}
        {messages.map((m) =>
          m.kind === 'system' ? (
            <p key={m.id} className="chat__system">{m.body}</p>
          ) : (
            <div key={m.id} className={`chat__msg${m.isMine ? ' chat__msg--mine' : ''}`}>
              <p>{m.body}</p>
              <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>
            </div>
          ),
        )}
      </div>

      {canWrite ? (
        <form onSubmit={submit} className="chat__form" noValidate>
          <label htmlFor={fieldId} className="sr-only">Сообщение</label>
          <textarea
            id={fieldId}
            rows={2}
            maxLength={MESSAGE_MAX}
            placeholder="Напишите сообщение…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() }
            }}
          />
          <Button type="submit" disabled={busy || !body.trim()}>Отправить</Button>
          {error && <div className="field__err chat__err" role="alert">{error}</div>}
        </form>
      ) : (
        <p className="muted chat__closed">Сделка закрыта — писать в чат нельзя.</p>
      )}
    </div>
  )
}
