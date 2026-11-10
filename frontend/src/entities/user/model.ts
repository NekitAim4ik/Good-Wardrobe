export type Role = 'user' | 'volunteer' | 'organizer' | 'admin'
export type RegisterRole = Exclude<Role, 'admin'>

export interface User {
  id: number
  name: string
  email: string
  role: Role
  points: number
}

export const roleLabels: Record<Role, string> = {
  user: 'участник',
  volunteer: 'волонтёр',
  organizer: 'организатор',
  admin: 'администратор',
}

export const registerRoles: { value: RegisterRole; label: string }[] = [
  { value: 'user', label: 'Отдавать и находить вещи' },
  { value: 'volunteer', label: 'Быть волонтёром' },
  { value: 'organizer', label: 'Вести пункт приёма' },
]

export const initials = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'