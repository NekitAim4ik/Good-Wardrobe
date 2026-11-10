import type { RegisterRole } from '../../entities/user/model'

export type Errors<T> = Partial<Record<keyof T, string>>

export interface LoginValues { email: string; password: string }
export interface RegisterValues {
  name: string
  email: string
  role: RegisterRole
  password: string
  password2: string
  agree: boolean
}

const hasLetter = (v: string) => /[A-Za-zА-Яа-яЁё]/.test(v)
const hasDigit = (v: string) => /\d/.test(v)

function emailError(v: string) {
  const email = v.trim()
  if (!email) return 'Введите эл. почту.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Проверьте адрес: он должен выглядеть как name@example.ru.'
  return ''
}

export function validateLogin(v: LoginValues): Errors<LoginValues> {
  const e: Errors<LoginValues> = {}
  const email = emailError(v.email)
  if (email) e.email = email
  if (!v.password) e.password = 'Введите пароль.'
  return e
}

export function validateRegister(v: RegisterValues): Errors<RegisterValues> {
  const e: Errors<RegisterValues> = {}
  if (v.name.trim().length < 2) e.name = 'Введите имя — не короче 2 символов.'
  const email = emailError(v.email)
  if (email) e.email = email
  if (!v.password) e.password = 'Введите пароль.'
  else if (v.password.length < 8 || !hasLetter(v.password) || !hasDigit(v.password)) {
    e.password = 'Пароль должен быть не короче 8 символов, с буквами и цифрами.'
  }
  if (v.password2 !== v.password) e.password2 = 'Пароли не совпадают.'
  if (!v.agree) e.agree = 'Подтвердите согласие, чтобы продолжить.'
  return e
}

export function passwordStrength(v: string): 0 | 1 | 2 | 3 {
  if (!v) return 0
  let s = 0
  if (v.length >= 8) s++
  if (hasLetter(v) && hasDigit(v)) s++
  if (v.length >= 12 || /[^\wА-Яа-яЁё]/.test(v)) s++
  return (s || 1) as 1 | 2 | 3
}