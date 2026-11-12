import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as userApi from '../../entities/user/api'
import type { User } from '../../entities/user/model'
import { setSessionLostHandler } from '../../shared/api/http'
import type { LoginValues, RegisterValues } from './validation'

interface AuthValue {
  user: User | null
  login: (v: LoginValues, remember: boolean) => Promise<void>
  register: (v: RegisterValues) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false) 

  useEffect(() => {
    let alive = true
    userApi.refresh().then((u) => {
      if (!alive) return
      setUser(u)
      setReady(true)
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    setSessionLostHandler(() => setUser(null))
    return () => setSessionLostHandler(null)
  }, [])

  const login = useCallback(async (v: LoginValues, remember: boolean) => {
    setUser(await userApi.login({ email: v.email, password: v.password, remember }))
  }, [])

  const register = useCallback(async (v: RegisterValues) => {
    setUser(await userApi.register({ name: v.name, email: v.email, password: v.password, role: v.role }))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    void userApi.logout()
  }, [])

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout])

  if (!ready) return <div className="boot" role="status">Загрузка…</div>
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth нужно вызывать внутри <AuthProvider>')
  return ctx
}