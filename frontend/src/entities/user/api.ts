import { http, setAccessToken, setRefresher } from '../../shared/api/http'
import type { RegisterRole, User } from './model'


export interface RegisterInput { name: string; email: string; password: string; role: RegisterRole }
export interface LoginInput { email: string; password: string; remember: boolean }

interface AuthResult { user: User; accessToken: string }

function accept(result: AuthResult): User {
  setAccessToken(result.accessToken)
  return result.user
}

export const register = (input: RegisterInput) =>
  http<AuthResult>('/auth/register', { method: 'POST', body: input, auth: false }).then(accept)

export const login = (input: LoginInput) =>
  http<AuthResult>('/auth/login', { method: 'POST', body: input, auth: false }).then(accept)

let pending: Promise<User | null> | null = null
export function refresh(): Promise<User | null> {
  if (!pending) {
    pending = http<AuthResult>('/auth/refresh', { method: 'POST', auth: false })
      .then(accept)
      .catch(() => {
        setAccessToken(null)
        return null
      })
      .finally(() => { pending = null })
  }
  return pending
}

export async function logout(): Promise<void> {
  setAccessToken(null)
  try {
    await http('/auth/logout', { method: 'POST', auth: false })
  } catch {
  }
}

setRefresher(async () => (await refresh()) !== null)