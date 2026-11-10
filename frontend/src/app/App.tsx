import { Route, Routes } from 'react-router-dom'
import { AuthPage } from '../pages/auth/AuthPage'
import { HomePage } from '../pages/home/HomePage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}