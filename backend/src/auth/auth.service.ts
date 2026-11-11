import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as argon2 from 'argon2'
import { randomBytes } from 'crypto'
import { toPublicUser, UsersService } from '../users/users.service'
import { Session } from './auth.types'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { TokensService } from './token.service'

const emailTaken = () =>
  new ConflictException({
    statusCode: 409,
    message: 'Эта почта уже зарегистрирована. Войдите в аккаунт.',
    field: 'email', 
  })

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash = ''

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokensService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await argon2.hash(randomBytes(16).toString('hex'))
  }

  async register(dto: RegisterDto): Promise<Session> {
    if (await this.users.findByEmail(dto.email)) throw emailTaken()

    const passwordHash = await argon2.hash(dto.password) 
    try {
      const user = await this.users.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role ?? 'user',
      })
      return this.startSession(user, true)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw emailTaken()
      throw e
    }
  }

  async login(dto: LoginDto): Promise<Session> {
    const user = await this.users.findByEmail(dto.email)
    const passwordOk = await argon2.verify(user?.passwordHash ?? this.dummyHash, dto.password)
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Неверная почта или пароль. Проверьте данные и попробуйте снова.')
    }
    return this.startSession(user, dto.remember ?? false)
  }

  async refresh(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken) throw new UnauthorizedException('Сессия не найдена. Войдите снова.')

    const { userId, refresh } = await this.tokens.rotateRefresh(refreshToken)
    const user = await this.users.findById(userId)
    if (!user) throw new UnauthorizedException('Аккаунт не найден. Войдите снова.')

    return { user: toPublicUser(user), accessToken: await this.tokens.signAccess(user), refresh }
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.tokens.revoke(refreshToken)
  }

  private async startSession(user: Parameters<typeof toPublicUser>[0], persistent: boolean): Promise<Session> {
    return {
      user: toPublicUser(user),
      accessToken: await this.tokens.signAccess(user),
      refresh: await this.tokens.issueRefresh(user.id, persistent),
    }
  }
}