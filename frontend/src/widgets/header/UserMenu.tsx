import { useEffect, useRef, useState } from 'react'
import { initials, roleLabels } from '../../entities/user/model'
import { useAuth } from '../../features/auth/AuthContext'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null
  return (
    <div className="usermenu" ref={ref}>
      <button type="button" className="avatar" aria-label="Личный кабинет" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        {initials(user.name)}
      </button>
      {open && (
        <div className="usermenu__panel">
          <strong>{user.name}</strong>
          <span className="muted">{user.email}</span>
          <span><span className="tag">{roleLabels[user.role]}</span> <span className="muted">Баллы: {user.points}</span></span>
          <button type="button" className="usermenu__out" onClick={() => { setOpen(false); logout() }}>Выйти</button>
        </div>
      )}
    </div>
  )
}