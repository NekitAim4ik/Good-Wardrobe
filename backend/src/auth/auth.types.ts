import { Role } from '@prisma/client'
import { Request } from 'express'
import { PublicUser } from '../users/users.service'

export interface AccessPayload {
  sub: string 
  role: Role
}

export interface AuthUser {
  id: number
  role: Role
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export interface RefreshGrant {
  token: string 
  expiresAt: Date
  persistent: boolean
}

export interface Session {
  user: PublicUser
  accessToken: string
  refresh: RefreshGrant
}

export interface AuthResponse {
  user: PublicUser
  accessToken: string
}
