import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { AccessPayload, AuthenticatedRequest } from '../auth.types'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()])
    if (isPublic) return true

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    const [type, token] = req.headers.authorization?.split(' ') ?? []
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Требуется вход в аккаунт.')

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token)
      req.user = { id: Number(payload.sub), role: payload.role }
      return true
    } catch {
      throw new UnauthorizedException('Сессия истекла. Войдите снова.')
    }
  }
}