import { useId, useState, type FormEvent } from 'react'
import { registerRoles } from '../../entities/user/model'
import { ApiError } from '../../shared/api/apierror'
import { Button } from '../../shared/ui/Button'
import { TextField } from '../../shared/ui/TextField'
import { focusField } from '../../shared/lib/focusfield'
import { useAuth } from './AuthContext'
import { passwordStrength, validateRegister, type Errors, type RegisterValues } from './validation'

const order = ['name', 'email', 'password', 'password2', 'agree'] as const

export function RegisterForm() {
  const { register } = useAuth()
  const roleId = useId()
  const agreeId = useId()
  const [values, setValues] = useState<RegisterValues>({
    name: '', email: '', role: 'user', password: '', password2: '', agree: false,
  })
  const [errors, setErrors] = useState<Errors<RegisterValues>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof RegisterValues>(k: K, v: RegisterValues[K]) => {
    setValues((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: undefined }))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setFormError('')
    const errs = validateRegister(values)
    setErrors(errs)
    const first = order.find((k) => errs[k])
    if (first) return focusField(form, first)

    setBusy(true)
    try {
      await register(values)
    } catch (err) {
      if (err instanceof ApiError && err.field === 'email') {
        setErrors({ email: err.message })
        focusField(form, 'email')
      } else {
        setFormError(err instanceof Error ? err.message : 'Не удалось создать аккаунт. Попробуйте ещё раз.')
      }
      setBusy(false)
    }
  }

  const strength = passwordStrength(values.password)

  return (
    <form onSubmit={onSubmit} noValidate>
      <h2>Создайте аккаунт</h2>
      <p className="auth__sub">Это бесплатно. Займёт минуту.</p>
      {formError && <div className="alert alert--bad" role="alert">{formError}</div>}

      <TextField label="Имя" name="name" autoComplete="name" placeholder="Анна Соколова"
        value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <TextField label="Эл. почта" name="email" type="email" autoComplete="email" placeholder="name@example.ru"
        value={values.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />

      <div className="field">
        <label htmlFor={roleId}>Я хочу</label>
        <select id={roleId} name="role" value={values.role}
          onChange={(e) => set('role', e.target.value as RegisterValues['role'])}>
          {registerRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <div className="field__hint">Роль можно будет изменить позже.</div>
      </div>

      <TextField label="Пароль" name="password" type="password" autoComplete="new-password"
        hint="Не короче 8 символов, буквы и цифры."
        value={values.password} onChange={(e) => set('password', e.target.value)} error={errors.password}>
        <div className="meter" aria-hidden="true"><b style={{ width: `${strength * 33.3}%` }} /></div>
      </TextField>
      <TextField label="Повторите пароль" name="password2" type="password" autoComplete="new-password"
        value={values.password2} onChange={(e) => set('password2', e.target.value)} error={errors.password2} />

      <div className="field">
        <div className="check">
          <input id={agreeId} name="agree" type="checkbox" checked={values.agree}
            aria-invalid={errors.agree ? true : undefined}
            onChange={(e) => set('agree', e.target.checked)} />
          <label htmlFor={agreeId}>Согласен с правилами платформы и обработкой персональных данных</label>
        </div>
        {errors.agree && <div className="field__err" role="alert">{errors.agree}</div>}
      </div>

      <Button type="submit" className="btn--block" disabled={busy}>{busy ? 'Подождите…' : 'Создать аккаунт'}</Button>
    </form>
  )
}