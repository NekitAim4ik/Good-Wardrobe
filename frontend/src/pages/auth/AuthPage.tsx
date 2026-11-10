import { useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { LoginForm } from '../../features/auth/LoginForm'
import { RegisterForm } from '../../features/auth/RegisterForm'
import { useAuth } from '../../features/auth/AuthContext'
import { Logo } from '../../shared/ui/Logo'
import './auth.css'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  useEffect(() => {
    document.title = (mode === 'login' ? 'Вход' : 'Регистрация') + ' — Добрый Шкаф'
    return () => { document.title = 'Добрый Шкаф' }
  }, [mode])

  if (user) return <Navigate to={from} replace />

  return (
    <div className="auth">
      <aside className="auth__hero">
        <Logo inverted />
        <div>
          <h1>Освободите место. Поделитесь добром.</h1>
          <p>Отдавайте то, чем больше не пользуетесь, и находите нужное рядом — в районном шкафу или у соседей.</p>
        </div>
        <ul className="auth__perks">
          <li>Пункты приёма в вашем районе</li>
          <li>Прямой обмен с соседями</li>
          <li>Баллы за каждую переданную вещь</li>
        </ul>
      </aside>

      <main className="auth__main">
        <div className="auth__card">
          <nav className="auth__tabs" aria-label="Вход или регистрация">
            <Link to="/login" state={location.state} className="auth__tab"
              aria-current={mode === 'login' ? 'page' : undefined}>Вход</Link>
            <Link to="/register" state={location.state} className="auth__tab"
              aria-current={mode === 'register' ? 'page' : undefined}>Регистрация</Link>
          </nav>
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </main>
    </div>
  )
}