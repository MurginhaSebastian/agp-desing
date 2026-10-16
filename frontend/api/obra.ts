/**
 * La tarjeta de una obra al compartir su enlace (/catalogo/{slug}) por WhatsApp, Facebook,
 * Telegram… Esos servicios no ejecutan JavaScript: de la web solo verían `index.html`, con el
 * logo y el texto de la portada. Aquí se les da una página mínima con la foto, el nombre y la
 * descripción de esa obra.
 *
 * `vercel.json` manda aquí solo a esos robots, por su user-agent. Las personas y Google siguen
 * recibiendo la web de siempre (Google ejecuta JavaScript y lee lo que pone `useSeo`).
 *
 * Si la obra no existe o el backend no responde, sale la tarjeta general de la web.
 */

interface ObraPublica {
  name: string
  slug: string
  description: string
  technique: string
  widthCm: number
  heightCm: number
  imageUrl: string
}

const MARCA = 'AGP Desing'
const TITULO_GENERAL = 'AGP Desing - Regalos y decoración corporativa'
const DESCRIPCION_GENERAL =
  'Cuadros 3D y boxes temáticos a medida, para regalar o para la oficina. Hechos a mano en Trujillo; cotiza por WhatsApp.'

/** Un robot de vista previa espera poco; si Render está dormido, mejor la tarjeta general. */
const ESPERA_MAXIMA_MS = 8_000

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Recorta en el último espacio antes del límite, para no partir palabras. */
function resumen(texto: string, limite = 200): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (limpio.length <= limite) return limpio
  const corte = limpio.lastIndexOf(' ', limite - 1)
  return `${limpio.slice(0, corte > 0 ? corte : limite - 1)}…`
}

interface Tarjeta {
  titulo: string
  descripcion: string
  imagen: string
  url: string
  tipo: 'product' | 'website'
}

export function paginaDeTarjeta(t: Tarjeta): string {
  const e = escaparHtml
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${e(t.titulo)}</title>
<meta name="description" content="${e(t.descripcion)}" />
<link rel="canonical" href="${e(t.url)}" />
<meta property="og:type" content="${t.tipo}" />
<meta property="og:site_name" content="${MARCA}" />
<meta property="og:locale" content="es_PE" />
<meta property="og:title" content="${e(t.titulo)}" />
<meta property="og:description" content="${e(t.descripcion)}" />
<meta property="og:url" content="${e(t.url)}" />
<meta property="og:image" content="${e(t.imagen)}" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body>
<h1>${e(t.titulo)}</h1>
<p>${e(t.descripcion)}</p>
<p><a href="${e(t.url)}">${e(t.url)}</a></p>
</body>
</html>
`
}

export function tarjetaDeObra(obra: ObraPublica | null, origen: string, slug: string): Tarjeta {
  if (!obra) {
    return { titulo: TITULO_GENERAL, descripcion: DESCRIPCION_GENERAL, imagen: `${origen}/og.jpg`, url: `${origen}/catalogo/${encodeURIComponent(slug)}`, tipo: 'website' }
  }
  const medidas = `${obra.widthCm} × ${obra.heightCm} cm`
  return {
    titulo: `${obra.name} — ${MARCA}`,
    descripcion: resumen(`${obra.technique}, ${medidas}. ${obra.description}`),
    // Las fotos subidas desde el panel ya son direcciones completas (Supabase); las de muestra no.
    imagen: new URL(obra.imageUrl, origen).href,
    url: `${origen}/catalogo/${encodeURIComponent(obra.slug)}`,
    tipo: 'product',
  }
}

async function buscarObra(slug: string): Promise<ObraPublica | null> {
  const api = (process.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')
  if (!api || !slug) return null
  try {
    const res = await fetch(`${api}/api/products/slug/${encodeURIComponent(slug)}`, {
      signal: AbortSignal.timeout(ESPERA_MAXIMA_MS),
    })
    if (!res.ok) return null
    return (await res.json()) as ObraPublica
  } catch (error) {
    console.error('obra: no se pudo leer la obra', error)
    return null
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug') ?? ''
  const obra = await buscarObra(slug)
  return new Response(paginaDeTarjeta(tarjetaDeObra(obra, url.origin, slug)), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Una hora en la caché de Vercel; si la obra cambia de foto, la tarjeta tarda como mucho eso.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
