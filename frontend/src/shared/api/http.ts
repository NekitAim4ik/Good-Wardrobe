import { ApiError } from './apierror'

const BASE = '/api'

let accessToken: string | null = null
let refresher: (() => Promise<boolean>) | null = null
let sessionLostHandler: (() => void) | null = null

export const setAccessToken = (token: string | null) => { accessToken = token }
export const setRefresher = (fn: () => Promise<boolean>) => { refresher = fn }
export const setSessionLostHandler = (fn: (() => void) | null) => { sessionLostHandler = fn }

interface Options {
  method?: string
  body?: unknown
  auth?: boolean 
}

async function send(path: string, { method = 'GET', body, auth = true }: Options): Promise<Response> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  try {
    return await fetch(BASE + path, {
      method,
      headers,
      credentials: 'include', 
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Нет связи с сервером. Проверьте подключение и попробуйте снова.')
  }
}

async function toError(res: Response): Promise<ApiError> {
  if (res.status === 429) return new ApiError('Слишком много попыток. Подождите минуту и попробуйте снова.')
  if (res.status >= 500) return new ApiError('Ошибка сервера. Попробуйте позже.')
  const body = (await res.json().catch(() => null)) as { message?: string | string[]; field?: string } | null
  const message = Array.isArray(body?.message) ? body.message[0] : body?.message
  return new ApiError(message || 'Не удалось выполнить запрос.', body?.field)
}

export async function http<T>(path: string, options: Options = {}): Promise<T> {
  let res = await send(path, options)

  if (res.status === 401 && options.auth !== false && refresher) {
    if (await refresher()) res = await send(path, options)
    else sessionLostHandler?.()
  }

  if (!res.ok) throw await toError(res)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}