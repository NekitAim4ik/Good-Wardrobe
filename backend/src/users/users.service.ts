import { Injectable } from '@nestjs/common'
import { Role, User } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'points'>

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  points: u.points,
})

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  create(data: { name: string; email: string; passwordHash: string; role: Role }) {
    return this.prisma.user.create({ data })
  }
}
