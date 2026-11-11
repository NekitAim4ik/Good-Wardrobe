import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Throttle } from '@nestjs/throttler'
import { CookieOptions, Request, Response } from 'express'
import { Env } from '../config/env'
import { toPublicUser, UsersService } from '../users/users.service'
import { AuthResponse, AuthUser, Session } from './auth.types'
import { AuthService } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

const REFRESH_COOKIE = 'dsh_refresh'
const REFRESH_PATH = '/api/auth' 

const STRICT = { default: { limit: 5, ttl: 60_000 } }

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Throttle(STRICT)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.respond(res, await this.auth.register(dto))
  }

  @Public()
  @Throttle(STRICT)
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.respond(res, await this.auth.login(dto))
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<AuthResponse> {
    return this.respond(res, await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]))
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE])
    res.clearCookie(REFRESH_COOKIE, this.baseCookieOptions())
  }

  @Get('me')
  async me(@CurrentUser() current: AuthUser): Promise<{ user: AuthResponse['user'] }> {
    const user = await this.users.findById(current.id)
    if (!user) throw new UnauthorizedException('Аккаунт не найден. Войдите снова.')
    return { user: toPublicUser(user) }
  }

  private respond(res: Response, session: Session): AuthResponse {
    const { token, expiresAt, persistent } = session.refresh
    res.cookie(REFRESH_COOKIE, token, {
      ...this.baseCookieOptions(),
      ...(persistent ? { expires: expiresAt } : {}),
    })
    return { user: session.user, accessToken: session.accessToken }
  }

  private baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true, 
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production', 
      sameSite: 'lax', 
      path: REFRESH_PATH,
    }
  }
}