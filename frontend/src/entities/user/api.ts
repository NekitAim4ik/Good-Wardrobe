import { ApiError } from '../../shared/api/apierror'
import type { RegisterRole, User } from './model'

// TODO: backend, потом переписать функции на API запросы

interface StoredUser extends User { password: string }

const KEY = 'dsh_users'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  try { localStorage.setItem(KEY, JSON.stringify(users)) } catch { /* хранилище недоступно */ }
}

const toPublic = ({ password: _password, ...user }: StoredUser): User => user

export interface RegisterInput { name: string; email: string; password: string; role: RegisterRole }
export interface LoginInput { email: string; password: string }

export async function register(input: RegisterInput): Promise<User> {
  await wait(500)
  const email = input.email.trim().toLowerCase()
  const users = readUsers()
  if (users.some((u) => u.email === email)) {
    throw new ApiError('Эта почта уже зарегистрирована. Войдите в аккаунт.', 'email')
  }
  const user: StoredUser = {
    id: Date.now(),
    name: input.name.trim(),
    email,
    password: input.password,
    role: input.role,
    points: 0,
  }
  writeUsers([...users, user])
  return toPublic(user)
}

export async function login(input: LoginInput): Promise<User> {
  await wait(500)
  const email = input.email.trim().toLowerCase()
  const user = readUsers().find((u) => u.email === email && u.password === input.password)
  if (!user) throw new ApiError('Неверная почта или пароль. Проверьте данные и попробуйте снова.')
  return toPublic(user)
}