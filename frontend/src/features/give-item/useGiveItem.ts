import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export const NEW_ITEM_PATH = '/items/new'

export function useGiveItem() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return useCallback(() => {
    if (user) navigate(NEW_ITEM_PATH)
    else navigate('/login', { state: { from: NEW_ITEM_PATH } }) 
  }, [user, navigate])
}
