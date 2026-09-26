import { pathToFileURL } from 'node:url'
/**
 * Contraste de texto sobre su fondo real.
 * axe ya mira contraste, pero se rinde cuando el fondo es translúcido o hay capas;
 * este control resuelve el apilado y convierte oklab(), que es lo que devuelve
 * Tailwind v4 en cuanto un color lleva opacidad.
 */
import {
  BASE, GRAVEDAD, RUTAS_PUBLICAS, RUTAS_PANEL, UTILES_COLOR,
  abrirNavegador, entrarAlPanel, imprimir, rutaDeUnProducto,
} from './shared.mjs'

const MEDIR = `(() => {
  ${UTILES_COLOR}
  const fallos = []
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || oculto(el)) continue
    const cs = getComputedStyle(el)
    if (Number(cs.opacity) <= 0.1) continue
    const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
    if (!propio) continue

    const fondo = fondoDe(el)
    const frente = sobre(aRgba(cs.color), fondo)
    const r = ratio(frente, fondo)
    const tam = parseFloat(cs.fontSize)
    const grande = tam >= 24 || (tam >= 18.66 && Number(cs.fontWeight) >= 700)
    const minimo = grande ? 3 : 4.5
    if (r < minimo) {
      fallos.push({
        texto: (el.textContent || '').trim().slice(0, 40),
        ratio: Math.round(r * 100) / 100,
        minimo,
        tam: Math.round(tam),
        frente: 'rgb(' + frente + ')',
        fondo: 'rgb(' + fondo + ')',
      })
    }
  }
  return fallos
})()
`

/** Caso malo conocido: greige sobre silk da 2.02:1. Si no lo caza, el control miente. */
const AUTOCOMPROBACION = `(() => {
  ${UTILES_COLOR}
  const d = document.createElement('div')
  d.textContent = 'autocomprobacion'
  d.style.cssText = 'color:#b19e90;background:#eee2d4;position:fixed;top:0;left:0;z-index:9999'
  document.body.appendChild(d)
  const r = ratio(sobre(aRgba(getComputedStyle(d).color), fondoDe(d)), fondoDe(d))
  d.remove()
  return Math.round(r * 100) / 100
})()
`

export async function run() {
  const hallazgos = []
  const navegador = await abrirNavegador()
  const page = await navegador.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const prueba = await page.evaluate(AUTOCOMPROBACION)
  if (Math.abs(prueba - 2.02) > 0.15) {
    hallazgos.push({
      gravedad: GRAVEDAD.critico,
      donde: 'la propia prueba',
      que: 'el medidor de contraste no da el valor conocido: el resultado no es de fiar',
      detalle: `esperado 2.02, obtenido ${prueba}`,
    })
  }

  const ficha = await rutaDeUnProducto(page)
  const rutas = [...RUTAS_PUBLICAS, ...(ficha ? [{ ruta: ficha, nombre: 'ficha de producto' }] : [])]

  for (const { ruta, nombre } of rutas) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    for (const f of await page.evaluate(MEDIR)) {
      hallazgos.push({
        gravedad: GRAVEDAD.critico,
        donde: nombre,
        que: `«${f.texto}» se lee con ${f.ratio}:1 (mínimo ${f.minimo})`,
        detalle: `${f.tam}px, ${f.frente} sobre ${f.fondo}`,
      })
    }
  }

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.click('button[aria-label="Abrir menú"]')
  await page.waitForTimeout(600)
  for (const f of await page.evaluate(MEDIR)) {
    hallazgos.push({
      gravedad: GRAVEDAD.critico,
      donde: 'menú móvil abierto',
      que: `«${f.texto}» se lee con ${f.ratio}:1 (mínimo ${f.minimo})`,
      detalle: `${f.frente} sobre ${f.fondo}`,
    })
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await entrarAlPanel(page)
  for (const { ruta, nombre } of RUTAS_PANEL.filter((r) => r.ruta !== '/admin/login')) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    for (const f of await page.evaluate(MEDIR)) {
      hallazgos.push({
        gravedad: GRAVEDAD.critico,
        donde: nombre,
        que: `«${f.texto}» se lee con ${f.ratio}:1 (mínimo ${f.minimo})`,
        detalle: `${f.frente} sobre ${f.fondo}`,
      })
    }
  }

  await navegador.close()
  return { titulo: 'Contraste de los textos', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.length ? 1 : 0)
}
