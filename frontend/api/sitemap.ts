/// <reference types="node" /> // función de Vercel: corre en Node y usa process.env
/**
 * /sitemap.xml — la lista de páginas que se le da a Google (Search Console).
 *
 * Es una función de Vercel y no un archivo de `public/` porque las obras viven en la base de
 * datos: cada cuadro que se sube desde el panel aparece aquí sin volver a publicar la web.
 * `vercel.json` reescribe `/sitemap.xml` hacia esta función.
 *
 * - Las obras salen de la API pública del backend (`VITE_API_URL`, la misma que usa la web).
 * - El dominio sale de la propia petición: con dominio propio no hay nada que cambiar aquí.
 * - Si el backend no responde (Render dormido), se devuelve 503 y Google vuelve a intentarlo.
 *   Nunca un sitemap a medias: le diría a Google que las obras ya no existen.
 */

interface ObraPublica {
  slug: string
  updatedAt?: string
}

/** Páginas fijas de la web pública. El panel (/admin) no va: robots.txt lo excluye. */
const PAGINAS_FIJAS = ['/', '/catalogo', '/pedido', '/privacidad', '/terminos']

/** Render gratis tarda hasta ~50 s en despertar; más que eso, mejor que Google reintente. */
const ESPERA_MAXIMA_MS = 25_000

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function entrada(loc: string, lastmod?: string): string {
  const fecha = lastmod && !Number.isNaN(Date.parse(lastmod)) ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''
  return `  <url><loc>${escaparXml(loc)}</loc>${fecha}</url>`
}

export function construirSitemap(origen: string, obras: ObraPublica[]): string {
  const urls = [
    ...PAGINAS_FIJAS.map((ruta) => entrada(origen + ruta)),
    ...obras
      .filter((o) => typeof o.slug === 'string' && o.slug !== '')
      .map((o) => entrada(`${origen}/catalogo/${encodeURIComponent(o.slug)}`, o.updatedAt)),
  ]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

export async function GET(request: Request): Promise<Response> {
  const api = (process.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')
  const origen = new URL(request.url).origin

  let obras: ObraPublica[] = []
  if (api) {
    try {
      const res = await fetch(`${api}/api/products`, { signal: AbortSignal.timeout(ESPERA_MAXIMA_MS) })
      if (!res.ok) throw new Error(`El backend respondió ${res.status}`)
      const datos: unknown = await res.json()
      if (!Array.isArray(datos)) throw new Error('El backend no devolvió una lista')
      obras = datos as ObraPublica[]
    } catch (error) {
      console.error('sitemap: no se pudo leer el catálogo', error)
      return new Response('El catálogo no responde ahora mismo. Vuelve a intentarlo en unos minutos.\n', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '600' },
      })
    }
  }

  return new Response(construirSitemap(origen, obras), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Una hora en la caché de Vercel: Google lo pide pocas veces y así no despierta a Render
      // en cada visita. Mientras se renueva, se sirve el anterior.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
