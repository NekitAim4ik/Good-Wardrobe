import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwtauth.guard'
import { RolesGuard } from './auth/guards/roles.guard'
import { CatalogModule } from './catalog/catalog.module'
import { validateEnv } from './config/env'
import { ItemsModule } from './items/items.module'
import { PrismaModule } from './prisma/prisma.module'
import { UploadsModule } from './uploads/uploads.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]), 
    PrismaModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    UploadsModule,
    ItemsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}