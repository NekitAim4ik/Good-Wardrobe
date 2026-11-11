import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

// По умолчанию ВСЕ маршруты требуют входа. @Public() открывает конкретный маршрут.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
