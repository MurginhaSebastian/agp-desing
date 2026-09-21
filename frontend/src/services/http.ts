import { env } from '@/config/env'
import { tokenStorage } from '@/security/tokenStorage'
import { ApiError, type ApiProblem } from '@/types/api'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
  auth?: boolean
}

/** Se dispara cuando el backend responde 401 con un token presente (expiró o fue revocado). */
export const unauthorizedEvent = new EventTarget()

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = tokenStorage.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${env.apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 401 && auth) {
    tokenStorage.clear()
    unauthorizedEvent.dispatchEvent(new Event('unauthorized'))
  }

  if (!res.ok) {
    const problem: ApiProblem = await res
      .json()
      .catch(() => ({ title: res.statusText || 'Error de red', status: res.status }))
    throw new ApiError({ ...problem, status: problem.status ?? res.status })
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
