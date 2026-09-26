/**
 * Piezas comunes de la suite de calidad.
 * Todos los controles arrancan de aquí para que midan igual.
 */
import { chromium } from 'playwright'

export const BASE = process.env.QA_BASE ?? 'http://localhost:5173'
export const API = process.env.QA_API ?? 'http://localhost:8080'
export const ADMIN = {
  usuario: process.env.QA_ADMIN_USER ?? 'admin',
  clave: process.env.QA_ADMIN_PASS ?? 'AgpAdmin2026!',
}

/** No hay Chrome en esta máquina; Edge usa el mismo motor. */
export const CANAL = process.env.QA_CHANNEL ?? 'msedge'

export const ANCHOS = [
  { w: 375, h: 812, nombre: 'móvil' },
  { w: 768, h: 1024, nombre: 'tablet' },
  { w: 1024, h: 768, nombre: 'portátil' },
  { w: 1440, h: 900, nombre: 'escritorio' },
]

export const RUTAS_PUBLICAS = [
  { ruta: '/', nombre: 'portada' },
  { ruta: '/catalogo', nombre: 'catálogo' },
  { ruta: '/privacidad', nombre: 'privacidad' },
  { ruta: '/terminos', nombre: 'términos' },
  { ruta: '/no-existe-esta-pagina', nombre: 'página no encontrada' },
]

export const RUTAS_PANEL = [
  { ruta: '/admin/login', nombre: 'entrar al panel' },
  { ruta: '/admin', nombre: 'lista de productos' },
  { ruta: '/admin/cuadros/nuevo', nombre: 'nuevo producto' },
  { ruta: '/admin/portada', nombre: 'portada (panel)' },
]

export const GRAVEDAD = { critico: 'CRÍTICO', alto: 'ALTO', medio: 'MEDIO', bajo: 'BAJO' }
const ORDEN = { 'CRÍTICO': 0, ALTO: 1, MEDIO: 2, BAJO: 3 }

export function ordenar(hallazgos) {
  return [...hallazgos].sort((a, b) => ORDEN[a.gravedad] - ORDEN[b.gravedad])
}

export async function abrirNavegador() {
  return chromium.launch({ channel: CANAL })
}

/**
 * axe-core exige que la página nazca de un contexto, no de `browser.newPage()`.
 * Devuelve { page, cerrar } para no olvidarse del contexto al terminar.
 */
export async function nuevaPagina(navegador, viewport = { width: 1440, height: 900 }) {
  const contexto = await navegador.newContext({ viewport })
  const page = await contexto.newPage()
  return { page, cerrar: () => contexto.close() }
}

/** Deja la sesión de administrador iniciada en esa página. */
export async function entrarAlPanel(page) {
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' })
  await page.fill('input[type=text]', ADMIN.usuario)
  await page.fill('input[type=password]', ADMIN.clave)
  await page.click('button[type=submit]')
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 10000 })
}

/** Primera ficha de producto que haya en el catálogo, o null si está vacío. */
export async function rutaDeUnProducto(page) {
  await page.goto(BASE + '/catalogo', { waitUntil: 'networkidle' })
  return page.getAttribute('a[href^="/catalogo/"]', 'href').catch(() => null)
}

/**
 * Desborde lateral REAL. `documentElement.scrollWidth` da falsos positivos cuando
 * dentro hay un contenedor con su propio scroll (la tabla del panel), así que se
 * intenta desplazar la página y se mira si de verdad se movió.
 */
export const MEDIR_DESBORDE = () => {
  const x0 = window.scrollX
  window.scrollTo(2000, window.scrollY)
  const movido = Math.round(window.scrollX)
  window.scrollTo(x0, window.scrollY)
  return Math.max(movido, document.body.scrollWidth - window.innerWidth)
}

/**
 * Convierte cualquier color calculado a [r,g,b,a]. Tailwind v4 devuelve oklab()
 * en cuanto hay opacidad; leerlo como si fuera rgb() da contrastes inventados.
 */
export const UTILES_COLOR = `
  function _srgb(x) {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
    return Math.max(0, Math.min(255, Math.round(v * 255)))
  }
  function _oklab(L, a, b) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
    return [
      _srgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      _srgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      _srgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ]
  }
  function aRgba(str) {
    if (!str || str === 'transparent') return [0, 0, 0, 0]
    const n = (str.match(/-?[\\d.]+/g) || []).map(Number)
    if (str.startsWith('oklab')) return [..._oklab(n[0], n[1], n[2]), n[3] === undefined ? 1 : n[3]]
    if (str.startsWith('oklch')) {
      const h = (n[2] * Math.PI) / 180
      return [..._oklab(n[0], n[1] * Math.cos(h), n[1] * Math.sin(h)), n[3] === undefined ? 1 : n[3]]
    }
    return [n[0], n[1], n[2], n[3] === undefined ? 1 : n[3]]
  }
  function sobre(frente, fondo) {
    const a = frente[3]
    return [0, 1, 2].map((i) => Math.round(frente[i] * a + fondo[i] * (1 - a)))
  }
  function luminancia([r, g, b]) {
    const c = [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  function fondoDe(el) {
    let n = el
    const capas = []
    while (n && n !== document.documentElement) {
      const c = aRgba(getComputedStyle(n).backgroundColor)
      if (c[3] > 0) capas.push(c)
      if (c[3] === 1) break
      n = n.parentElement
    }
    let base = [255, 255, 255]
    for (const c of capas.reverse()) base = sobre(c, base)
    return base
  }
  function ratio(frente, fondo) {
    const l1 = luminancia(frente), l2 = luminancia(fondo)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  /** Visible de verdad: offsetParent es null en todo lo que sea position:fixed. */
  function visible(el) {
    const cs = getComputedStyle(el)
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0
  }
  function oculto(el) {
    return el.closest('[aria-hidden="true"]') !== null || (el.className || '').toString().includes('sr-only')
  }
`

export function imprimir(titulo, hallazgos) {
  console.log(`\n### ${titulo}`)
  if (hallazgos.length === 0) {
    console.log('  sin hallazgos')
    return
  }
  for (const h of ordenar(hallazgos)) {
    console.log(`  ${h.gravedad.padEnd(8)} ${(h.donde ?? '').padEnd(26)} ${h.que}${h.detalle ? '  → ' + h.detalle : ''}`)
  }
}
