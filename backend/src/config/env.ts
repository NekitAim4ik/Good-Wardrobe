export interface Env {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DATABASE_URL: string
  JWT_ACCESS_SECRET: string
  ACCESS_TTL_SECONDS: number
  REFRESH_TTL_DAYS: number
  CORS_ORIGIN: string
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const errors: string[] = []

  const text = (key: string, fallback?: string): string => {
    const v = raw[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (fallback !== undefined) return fallback
    errors.push(`${key} не задана`)
    return ''
  }
  const int = (key: string, fallback: number, min = 1): number => {
    const v = raw[key]
    if (v === undefined || v === '') return fallback
    const n = Number(v)
    if (!Number.isInteger(n) || n < min) {
      errors.push(`${key} должна быть целым числом не меньше ${min}`)
      return fallback
    }
    return n
  }

  const nodeEnv = text('NODE_ENV', 'development')
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV должна быть development, production или test')
  }
  const secret = text('JWT_ACCESS_SECRET')
  if (secret && secret.length < 32) errors.push('JWT_ACCESS_SECRET должна быть не короче 32 символов')

  const env: Env = {
    NODE_ENV: nodeEnv as Env['NODE_ENV'],
    PORT: int('PORT', 3000),
    DATABASE_URL: text('DATABASE_URL'),
    JWT_ACCESS_SECRET: secret,
    ACCESS_TTL_SECONDS: int('ACCESS_TTL_SECONDS', 900, 60),
    REFRESH_TTL_DAYS: int('REFRESH_TTL_DAYS', 30),
    CORS_ORIGIN: text('CORS_ORIGIN', 'http://localhost:5173'),
  }

  if (errors.length) throw new Error(`Неверная конфигурация (.env):\n- ${errors.join('\n- ')}`)
  return env
}