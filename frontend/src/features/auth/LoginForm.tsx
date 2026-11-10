import { useState, type FormEvent } from 'react'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { focusField } from '../../shared/lib/focusfield'
import { useAuth } from './AuthContext'
import { validateLogin, type Errors, type LoginValues } from './validation'

export function LoginForm() {
  const { login } = useAuth()
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Errors<LoginValues>>({})
  const [formError, setFormError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k: keyof LoginValues, v: string) => {
    setValues((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: undefined }))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setFormError('')
    setInfo('')
    const errs = validateLogin(values)
    setErrors(errs)
    const first = (['email', 'password'] as const).find((k) => errs[k])
    if (first) return focusField(form, first)

    setBusy(true)
    try {
      await login(values, remember)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось войти. Попробуйте ещё раз.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h2>С возвращением</h2>
      <p className="auth__sub">Войдите, чтобы увидеть свои объявления и баллы.</p>
      {formError && <div className="alert alert--bad" role="alert">{formError}</div>}
      {info && <div className="alert" role="status">{info}</div>}

      <TextField label="Эл. почта" name="email" type="email" autoComplete="email" placeholder="name@example.ru"
        value={values.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
      <TextField label="Пароль" name="password" type="password" autoComplete="current-password"
        value={values.password} onChange={(e) => set('password', e.target.value)} error={errors.password} />

      <div className="auth__row">
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Запомнить меня</span>
        </label>
        <button type="button" className="link-btn"
          onClick={() => setInfo('Восстановление пароля появится вместе с серверной частью.')}>
          Забыли пароль?
        </button>
      </div>

      <Button type="submit" className="btn--block" disabled={busy}>{busy ? 'Подождите…' : 'Войти'}</Button>
    </form>
  )
}