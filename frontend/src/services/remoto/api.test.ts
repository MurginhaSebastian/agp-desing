import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '@/security/tokenStorage'
import { ajustesRemotos, imagenesRemotas, productosRemotos, sesionRemota, ventasRemotas } from '@/services/remoto/api'
import { unauthorizedEvent } from '@/services/http'
import { ApiError } from '@/types/api'

const fetchFalso = vi.fn()
const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })
const ultima = () => {
  const [url, init] = fetchFalso.mock.calls.at(-1) as [string, RequestInit]
  return { url, init, headers: init.headers as Record<string, string> }
}

beforeEach(() => {
  fetchFalso.mockReset()
  vi.stubGlobal('fetch', fetchFalso)
  tokenStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  tokenStorage.clear()
})

const iniciarSesion = () => tokenStorage.set('abc.def', new Date(Date.now() + 60_000).toISOString())

describe('cabecera Authorization', () => {
  it('con sesión y auth la manda como Bearer', async () => {
    iniciarSesion()
    fetchFalso.mockResolvedValue(json({}))
    await productosRemotos.getById('7')
    expect(ultima().headers.Authorization).toBe('Bearer abc.def')
  })

  it('sin sesión no la manda, aunque la ruta pida auth', async () => {
    fetchFalso.mockResolvedValue(json({}))
    await productosRemotos.getById('7')
    expect(ultima().headers).not.toHaveProperty('Authorization')
  })

  it('en rutas públicas no la manda, aunque haya sesión', async () => {
    iniciarSesion()
    fetchFalso.mockResolvedValue(json([]))
    await productosRemotos.list()
    expect(ultima().headers).not.toHaveProperty('Authorization')
  })

  it('con el token caducado no la manda', async () => {
    tokenStorage.set('viejo', new Date(Date.now() - 1000).toISOString())
    fetchFalso.mockResolvedValue(json({}))
    await productosRemotos.getById('7')
    expect(ultima().headers).not.toHaveProperty('Authorization')
  })
})

describe('forma de las peticiones', () => {
  it('JSON: método, Content-Type y cuerpo serializado', async () => {
    iniciarSesion()
    fetchFalso.mockResolvedValue(json({ heroImageUrl: 'x' }))
    await ajustesRemotos.save({ heroImageUrl: 'x' })
    const { url, init, headers } = ultima()
    expect(url).toBe('/api/settings')
    expect(init.method).toBe('PUT')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Accept).toBe('application/json')
    expect(init.body).toBe('{"heroImageUrl":"x"}')
  })

  it('GET sin cuerpo no lleva Content-Type', async () => {
    fetchFalso.mockResolvedValue(json({ heroImageUrl: '' }))
    await ajustesRemotos.get()
    expect(ultima().headers).not.toHaveProperty('Content-Type')
    expect(ultima().init.body).toBeUndefined()
  })

  it('subir foto manda FormData sin Content-Type a mano y devuelve la url', async () => {
    iniciarSesion()
    fetchFalso.mockResolvedValue(json({ url: 'https://cdn/x.jpg' }))
    const url = await imagenesRemotas.subir(new File(['x'], 'x.jpg', { type: 'image/jpeg' }))
    expect(url).toBe('https://cdn/x.jpg')
    const { init, headers } = ultima()
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('archivo')).toBeInstanceOf(File)
    expect(headers).not.toHaveProperty('Content-Type')
  })

  it('codifica el slug y los parámetros', async () => {
    iniciarSesion()
    fetchFalso.mockImplementation(async () => json({}))
    await productosRemotos.getBySlug('a b/ñ')
    expect(ultima().url).toBe('/api/products/slug/a%20b%2F%C3%B1')
    await ventasRemotas.list({ desde: '2026-01-01', hasta: '2026-01-31' })
    expect(ultima().url).toBe('/api/sales?desde=2026-01-01&hasta=2026-01-31')
  })

  it('exportar pide un archivo: Accept */* y devuelve Blob', async () => {
    iniciarSesion()
    fetchFalso.mockResolvedValue(new Response('a,b', { status: 200 }))
    const blob = await ventasRemotas.exportar({ desde: 'a', hasta: 'b' })
    expect(ultima().headers.Accept).toBe('*/*')
    expect(blob).toBeInstanceOf(Blob)
    expect(await blob.text()).toBe('a,b')
  })

  it('un 204 devuelve undefined sin leer el cuerpo', async () => {
    iniciarSesion()
    fetchFalso.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(productosRemotos.remove('1')).resolves.toBeUndefined()
    expect(ultima().init.method).toBe('DELETE')
  })
})

describe('errores del backend', () => {
  it('ProblemDetail: ApiError con status, mensaje (detail) y fieldErrors', async () => {
    fetchFalso.mockResolvedValue(
      json({ title: 'Bad Request', status: 400, detail: 'Datos inválidos', errors: { name: 'obligatorio' } }, 400),
    )
    const error = await sesionRemota.login({ username: 'a', password: 'b' }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('Datos inválidos')
    expect(error.fieldErrors).toEqual({ name: 'obligatorio' })
  })

  it('sin detail usa el title, y sin errors fieldErrors es {}', async () => {
    fetchFalso.mockResolvedValue(json({ title: 'Conflicto', status: 409 }, 409))
    const error = await productosRemotos.list().catch((e) => e)
    expect(error.message).toBe('Conflicto')
    expect(error.fieldErrors).toEqual({})
  })

  it('si el cuerpo no es JSON, cae al status HTTP', async () => {
    fetchFalso.mockResolvedValue(new Response('<html>', { status: 502, statusText: 'Bad Gateway' }))
    const error = await productosRemotos.list().catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
    expect(error.message).toBe('Bad Gateway')
  })

  it('si el problema no trae status, usa el de la respuesta', async () => {
    fetchFalso.mockResolvedValue(json({ title: 'Nada' }, 404))
    const error = await productosRemotos.list().catch((e) => e)
    expect(error.status).toBe(404)
  })

  it('un fallo de red se propaga tal cual (no es ApiError)', async () => {
    fetchFalso.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(productosRemotos.list()).rejects.toBeInstanceOf(TypeError)
  })
})

describe('401', () => {
  it('con auth: borra la sesión, avisa y lanza ApiError 401', async () => {
    iniciarSesion()
    const aviso = vi.fn()
    unauthorizedEvent.addEventListener('unauthorized', aviso)
    fetchFalso.mockResolvedValue(json({ title: 'Unauthorized', status: 401 }, 401))
    const error = await productosRemotos.create({} as never).catch((e) => e)
    unauthorizedEvent.removeEventListener('unauthorized', aviso)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    expect(aviso).toHaveBeenCalledOnce()
    expect(tokenStorage.get()).toBeNull()
  })

  it('en una ruta pública (login con clave mala) no dispara el evento ni toca la sesión', async () => {
    iniciarSesion()
    const aviso = vi.fn()
    unauthorizedEvent.addEventListener('unauthorized', aviso)
    fetchFalso.mockResolvedValue(json({ title: 'Unauthorized', status: 401 }, 401))
    await sesionRemota.login({ username: 'a', password: 'x' }).catch(() => {})
    unauthorizedEvent.removeEventListener('unauthorized', aviso)
    expect(aviso).not.toHaveBeenCalled()
    expect(tokenStorage.get()).toBe('abc.def')
  })

  it('un 403 no cierra la sesión', async () => {
    iniciarSesion()
    const aviso = vi.fn()
    unauthorizedEvent.addEventListener('unauthorized', aviso)
    fetchFalso.mockResolvedValue(json({ title: 'Forbidden', status: 403 }, 403))
    await productosRemotos.remove('1').catch(() => {})
    unauthorizedEvent.removeEventListener('unauthorized', aviso)
    expect(aviso).not.toHaveBeenCalled()
    expect(tokenStorage.get()).toBe('abc.def')
  })
})
