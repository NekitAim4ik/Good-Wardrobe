import { Route, Routes } from 'react-router-dom'
import { AuthPage } from '../pages/auth/AuthPage'
import { DealPage } from '../pages/deal/DealPage'
import { DealsPage } from '../pages/deals/DealsPage'
import { HomePage } from '../pages/home/HomePage'
import { ItemPage } from '../pages/item/ItemPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/items/:id" element={<ItemPage />} />
      <Route path="/deals" element={<DealsPage />} />
      <Route path="/deals/:id" element={<DealPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}