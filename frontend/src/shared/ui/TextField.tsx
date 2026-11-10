import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  error?: string
  hint?: string
  children?: ReactNode
}

export function TextField({ label, error, hint, type = 'text', children, ...rest }: Props) {
  const id = useId()
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`field__box${isPassword ? ' field__box--pw' : ''}`}>
        <input
          {...rest}
          id={id}
          type={isPassword && shown ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {isPassword && (
          <button type="button" className="field__toggle" onClick={() => setShown((s) => !s)}>
            {shown ? 'Скрыть' : 'Показать'}
          </button>
        )}
      </div>
      {children}
      {hint && <div id={`${id}-hint`} className="field__hint">{hint}</div>}
      {error && <div id={`${id}-err`} className="field__err" role="alert">{error}</div>}
    </div>
  )
}