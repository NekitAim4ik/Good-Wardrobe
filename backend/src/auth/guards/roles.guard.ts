import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { AuthenticatedRequest } from '../auth.types'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()])
    if (!required?.length) return true

    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user
    if (!user || !required.includes(user.role)) throw new ForbiddenException('Недостаточно прав для этого действия.')
    return true
  }
}