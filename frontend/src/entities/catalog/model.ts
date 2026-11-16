export interface Category {
  id: number
  slug: string
  name: string
  examples: string | null
  requiresWeight: boolean 
}

export interface City {
  id: number
  name: string
  isTest: boolean
  districts: { id: number; name: string }[]
}
