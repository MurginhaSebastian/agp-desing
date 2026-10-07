import { env } from '@/config/env'
import { tokenStorage } from '@/security/tokenStorage'
import { ApiError, type ApiProblem } from '@/types/api'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
  auth?: boolean
  /** La respuesta es un archivo (el CSV de ventas): se devuelve como Blob en vez de leer JSON. */
  archivo?: boolean
}

/** Se dispara cuando el backend responde 401 con un token presente (expiró o fue revocado). */
export const unauthorizedEvent = new EventTarget()

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, archivo = false } = options
  // Un archivo va como FormData: el Content-Type lo pone el navegador porque incluye el
  // separador entre partes, y escribirlo a mano rompería el envío.
  const esArchivo = body instanceof FormData
  // Pidiendo un archivo no se dice «solo JSON»: el servidor respondería 406 al CSV.
  const headers: Record<string, string> = { Accept: archivo ? '*/*' : 'application/json' }
  if (body !== undefined && !esArchivo) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = tokenStorage.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${env.apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : esArchivo ? body : JSON.stringify(body),
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
  if (archivo) return (await res.blob()) as T
  return (await res.json()) as T
}
