import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { Env } from '../config/env'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { TokensService } from './token.service'

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: { algorithm: 'HS256', expiresIn: config.get('ACCESS_TTL_SECONDS', { infer: true }) },
        verifyOptions: { algorithms: ['HS256'] }, 
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService],
  exports: [JwtModule], 
})
export class AuthModule {}