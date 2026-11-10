import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import * as userApi from '../../entities/user/api'
import type { User } from '../../entities/user/model'
import { clearSession, loadSession, saveSession } from './session'
import type { LoginValues, RegisterValues } from './validation'

interface AuthValue {
  user: User | null
  login: (v: LoginValues, remember: boolean) => Promise<void>
  register: (v: RegisterValues) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession)

  const login = useCallback(async (v: LoginValues, remember: boolean) => {
    const u = await userApi.login({ email: v.email, password: v.password })
    saveSession(u, remember)
    setUser(u)
  }, [])

  const register = useCallback(async (v: RegisterValues) => {
    const u = await userApi.register({ name: v.name, email: v.email, password: v.password, role: v.role })
    saveSession(u, true)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth нужно вызывать внутри <AuthProvider>')
  return ctx
}