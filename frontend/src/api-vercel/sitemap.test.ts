/// <reference types="node" /> // api/ usa process.env y entra al tsc por este import
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET, construirSitemap } from '../../api/sitemap'

const ORIGEN = 'https://agp-desing.vercel.app'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('construirSitemap', () => {
  it('lleva las páginas fijas y ninguna del panel', () => {
    const xml = construirSitemap(ORIGEN, [])
    for (const ruta of ['/', '/catalogo', '/pedido', '/privacidad', '/terminos']) {
      expect(xml).toContain(`<loc>${ORIGEN}${ruta}</loc>`)
    }
    expect(xml).not.toContain('/admin')
    expect(xml.startsWith('<?xml')).toBe(true)
  })

  it('cada obra entra con su slug y la fecha recortada a día', () => {
    const xml = construirSitemap(ORIGEN, [{ slug: 'tarde-en-bordeaux', updatedAt: '2026-03-04T10:20:30Z' }])
    expect(xml).toContain(`<loc>${ORIGEN}/catalogo/tarde-en-bordeaux</loc><lastmod>2026-03-04</lastmod>`)
  })

  it('sin fecha o con fecha inválida, la obra entra sin lastmod', () => {
    const xml = construirSitemap(ORIGEN, [{ slug: 'a' }, { slug: 'b', updatedAt: 'ayer' }])
    expect(xml).toContain(`<loc>${ORIGEN}/catalogo/a</loc></url>`)
    expect(xml).toContain(`<loc>${ORIGEN}/catalogo/b</loc></url>`)
    expect(xml).not.toContain('lastmod')
  })

  it('descarta obras sin slug y codifica el slug para que no rompa el XML', () => {
    const xml = construirSitemap(ORIGEN, [{ slug: '' }, { slug: undefined as unknown as string }, { slug: 'a&b<c>' }])
    expect(xml.match(/<url>/g)).toHaveLength(5 + 1)
    expect(xml).toContain('/catalogo/a%26b%3Cc%3E<')
  })

  it('escapa el origen si trae caracteres de XML', () => {
    expect(construirSitemap('https://x.com/?a=1&b=2', [])).toContain('https://x.com/?a=1&amp;b=2/</loc>')
  })
})

describe('GET /sitemap.xml', () => {
  const peticion = () => new Request(`${ORIGEN}/sitemap.xml`)

  it('sin VITE_API_URL sirve solo las páginas fijas, sin llamar a nadie', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(peticion())
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/xml')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('con backend, suma las obras y quita espacios y barra final de la URL', async () => {
    vi.stubEnv('VITE_API_URL', ' https://api.test/ ')
    const fetchMock = vi.fn().mockResolvedValue(Response.json([{ slug: 'uno' }]))
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(peticion())
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/products')
    expect(await res.text()).toContain('/catalogo/uno')
  })

  it.each([
    ['el backend responde 500', () => new Response('x', { status: 500 })],
    ['el backend no devuelve una lista', () => Response.json({ no: 'lista' })],
  ])('si %s, 503 con Retry-After y nunca un sitemap a medias', async (_t, respuesta) => {
    vi.stubEnv('VITE_API_URL', 'https://api.test')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta()))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await GET(peticion())
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('600')
    expect(await res.text()).not.toContain('<urlset')
  })

  it('si fetch falla (Render dormido), 503', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.test')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await GET(peticion())).status).toBe(503)
  })
})
