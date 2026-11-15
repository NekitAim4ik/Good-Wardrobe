export interface CategoryDto {
  id: number
  slug: string
  name: string
  examples: string | null
  requiresWeight: boolean 
}

export interface CityDto {
  id: number
  name: string
  isTest: boolean
  districts: { id: number; name: string }[]
}
