import { http } from '../../shared/api/http'
import type { Category, City } from './model'

export const getCategories = () => http<Category[]>('/categories')
export const getDistricts = () => http<City[]>('/districts')
