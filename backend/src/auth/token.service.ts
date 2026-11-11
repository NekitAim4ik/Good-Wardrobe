import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Role } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import { Env } from '../config/env'
import { PrismaService } from '../prisma/prisma.service'
import { AccessPayload, RefreshGrant } from './auth.types'

const DAY_MS = 24 * 60 * 60 * 1000
const SESSION_TTL_MS = DAY_MS 
const REUSE_GRACE_MS = 10_000

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  signAccess(user: { id: number; role: Role }): Promise<string> {
    const payload: AccessPayload = { sub: String(user.id), role: user.role }
    return this.jwt.signAsync(payload)
  }

  async issueRefresh(userId: number, persistent: boolean): Promise<RefreshGrant> {
    const ttl = persistent ? this.config.get('REFRESH_TTL_DAYS', { infer: true }) * DAY_MS : SESSION_TTL_MS
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + ttl)

    await this.prisma.refreshToken.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } })
    await this.prisma.refreshToken.create({
      data: { tokenHash: sha256(token), userId, persistent, expiresAt },
    })
    return { token, expiresAt, persistent }
  }

  async rotateRefresh(token: string): Promise<{ userId: number; refresh: RefreshGrant }> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(token) } })
    if (!record) throw this.invalid()

    if (record.revokedAt) {
      if (Date.now() - record.revokedAt.getTime() > REUSE_GRACE_MS) await this.revokeAll(record.userId)
      throw this.invalid()
    }
    if (record.expiresAt <= new Date()) throw this.invalid()

    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (count === 0) throw this.invalid()

    return { userId: record.userId, refresh: await this.issueRefresh(record.userId, record.persistent) }
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  revokeAll(userId: number) {
    return this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })
  }

  private invalid() {
    return new UnauthorizedException('Сессия истекла. Войдите снова.')
  }
}