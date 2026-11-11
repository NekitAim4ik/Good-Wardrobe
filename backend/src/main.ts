import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { Env } from './config/env'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get<ConfigService<Env, true>>(ConfigService)

  app.setGlobalPrefix('api')
  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(',').map((s) => s.trim()),
    credentials: true, 
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true,
    }),
  )
  app.enableShutdownHooks()

  const port = config.get('PORT', { infer: true })
  await app.listen(port)
  console.log(`API: http://localhost:${port}/api`)
}

bootstrap()