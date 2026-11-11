import { SetMetadata } from '@nestjs/common'
import { Role } from '@prisma/client'

export const ROLES_KEY = 'roles'

// Пример: @Roles('organizer', 'admin') — маршрут только для этих ролей
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
