/// <reference types="node" /> // api/ usa process.env y entra al tsc por este import
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET, paginaDeTarjeta, tarjetaDeObra } from '../../api/obra'

const ORIGEN = 'https://agp-desing.vercel.app'
const UUID = '3f2b1c9e-8d7a-4b6c-9e1f-0a2b3c4d5e6f'
const ALMACEN = 'https://abc.supabase.co/storage/v1/object/public/productos'

const obra = {
  name: 'Tarde "en" Bordeaux',
  slug: 'tarde-en-bordeaux',
  description: 'Un cuadro con capas.',
  technique: 'Cuadro 3D',
  widthCm: 40,
  heightCm: 60,
  imageUrl: '/images/obras/01.svg',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('tarjetaDeObra', () => {
  it('sin obra, la tarjeta general de la web apuntando al slug pedido', () => {
    const t = tarjetaDeObra(null, ORIGEN, 'no existe')
    expect(t.tipo).toBe('website')
    expect(t.imagen).toBe(`${ORIGEN}/og.jpg`)
    expect(t.url).toBe(`${ORIGEN}/catalogo/no%20existe`)
  })

  it('con obra: título con marca, medidas en la descripción e imagen absoluta', () => {
    const t = tarjetaDeObra(obra, ORIGEN, obra.slug)
    expect(t.tipo).toBe('product')
    expect(t.titulo).toBe('Tarde "en" Bordeaux — AGP Desing')
    expect(t.descripcion).toBe('Cuadro 3D, 40 × 60 cm. Un cuadro con capas.')
    expect(t.imagen).toBe(`${ORIGEN}/images/obras/01.svg`)
    expect(t.url).toBe(`${ORIGEN}/catalogo/tarde-en-bordeaux`)
  })

  it('una foto ya absoluta no se pega al origen, y la reducida manda sobre la original', () => {
    expect(tarjetaDeObra({ ...obra, imageUrl: `${ALMACEN}/${UUID}.jpg` }, ORIGEN, 'x').imagen).toBe(`${ALMACEN}/${UUID}.jpg`)
    expect(tarjetaDeObra(obra, ORIGEN, 'x', `${ALMACEN}/${UUID}.min.jpg`).imagen).toBe(`${ALMACEN}/${UUID}.min.jpg`)
  })

  it('descripción larga: corta en un espacio, no parte palabras y no pasa de 200', () => {
    const d = tarjetaDeObra({ ...obra, description: 'palabra '.repeat(80) }, ORIGEN, 'x').descripcion
    expect(d.length).toBeLessThanOrEqual(200)
    expect(d.endsWith('…')).toBe(true)
    expect(d.slice(0, -1).trimEnd().endsWith('palabra')).toBe(true)
  })

  it('espacios y saltos de línea se colapsan', () => {
    expect(tarjetaDeObra({ ...obra, description: 'a\n\n  b' }, ORIGEN, 'x').descripcion).toContain('a b')
  })
})

describe('paginaDeTarjeta', () => {
  it('escapa HTML en título y descripción (nadie inyecta etiquetas desde el panel)', () => {
    const html = paginaDeTarjeta({
      titulo: '<script>alert(1)</script>',
      descripcion: `a "b" & 'c'`,
      imagen: `${ORIGEN}/og.jpg`,
      url: `${ORIGEN}/catalogo/x`,
      tipo: 'product',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('content="a &quot;b&quot; &amp; &#39;c&#39;"')
    expect(html).toContain('<meta property="og:type" content="product" />')
    expect(html).toContain(`<meta property="og:image" content="${ORIGEN}/og.jpg" />`)
  })
})

describe('GET /api/obra', () => {
  const pedir = (slug: string) => GET(new Request(`${ORIGEN}/api/obra?slug=${encodeURIComponent(slug)}`))

  it('sin VITE_API_URL, tarjeta general y sin llamadas', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const html = await (await pedir('x')).text()
    expect(f).not.toHaveBeenCalled()
    expect(html).toContain('og:type" content="website"')
  })

  it('obra con foto de muestra: tarjeta de la obra, sin HEAD a ninguna copia', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.test/')
    const f = vi.fn().mockResolvedValue(Response.json(obra))
    vi.stubGlobal('fetch', f)
    const res = await pedir(obra.slug)
    expect(f).toHaveBeenCalledTimes(1)
    expect(f.mock.calls[0][0]).toBe('https://api.test/api/products/slug/tarde-en-bordeaux')
    expect(res.headers.get('Content-Type')).toContain('text/html')
    expect(await res.text()).toContain('og:type" content="product"')
  })

  it('foto del almacén: usa la copia .min.jpg si existe y la original si no', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.test')
    const conFoto = { ...obra, imageUrl: `${ALMACEN}/${UUID}.png` }
    const montar = (headOk: boolean) =>
      vi.stubGlobal(
        'fetch',
        vi.fn((_u: string, init?: RequestInit) =>
          Promise.resolve(init?.method === 'HEAD' ? new Response(null, { status: headOk ? 200 : 404 }) : Response.json(conFoto)),
        ),
      )
    montar(true)
    expect(await (await pedir(obra.slug)).text()).toContain(`${ALMACEN}/${UUID}.min.jpg`)
    montar(false)
    expect(await (await pedir(obra.slug)).text()).toContain(`${ALMACEN}/${UUID}.png`)
  })

  it('backend caído o 404: tarjeta general, nunca error', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.test')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    expect(await (await pedir('x')).text()).toContain('og:type" content="website"')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('caído')))
    const res = await pedir('x')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('og:type" content="website"')
  })
})
