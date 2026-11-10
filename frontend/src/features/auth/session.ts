import type { User } from '../../entities/user/model'

const KEY = 'dsh_session'

export function loadSession(): User | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(KEY)
      if (raw) return JSON.parse(raw) as User
    } catch { /* повреждённые данные или нет доступа — игнорируем */ }
  }
  return null
}

export function saveSession(user: User, remember: boolean) {
  clearSession()
  try { (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user)) } catch { /* ignore */ }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) } catch { /* ignore */ }
}