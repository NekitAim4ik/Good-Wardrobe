import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { getCategories, getDistricts } from '../../entities/catalog/api'
import type { Category, City } from '../../entities/catalog/model'
import { useAuth } from '../../features/auth/AuthContext'
import { ItemForm } from '../../features/item-form/ItemForm'
import { Header } from '../../widgets/header/Header'
import './new-item.css'

export function NewItemPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [catalog, setCatalog] = useState<{ categories: Category[]; cities: City[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let alive = true
    Promise.all([getCategories(), getDistricts()])
      .then(([categories, cities]) => alive && setCatalog({ categories, cities }))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Не удалось загрузить справочники.'))
    return () => { alive = false }
  }, [user])

  useEffect(() => {
    document.title = 'Отдать вещь — Добрый Шкаф'
    return () => { document.title = 'Добрый Шкаф' }
  }, [])

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  return (
    <>
      <Header />
      <main className="container newitem">
        <Link to="/" className="itempage__back">← На главную</Link>
        <h1>Отдать вещь</h1>
        <p className="muted newitem__lead">Расскажите о вещи — и она найдёт нового владельца.</p>

        {error && <div className="alert alert--bad" role="alert">{error}</div>}
        {!catalog && !error && <p className="muted" role="status">Загрузка…</p>}
        {catalog && (
          <div className="card pad">
            <ItemForm categories={catalog.categories} cities={catalog.cities} />
          </div>
        )}
      </main>
    </>
  )
}
