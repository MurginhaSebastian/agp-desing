import { pathToFileURL } from 'node:url'
/**
 * Cómo se comporta la web en móvil, tablet, portátil y escritorio.
 * Mide en el navegador: desborde lateral de verdad, tamaño de los botones para el
 * dedo, textos cortados y si las llamadas a la acción quedan fuera de pantalla.
 */
import {
  ANCHOS, BASE, GRAVEDAD, RUTAS_PUBLICAS, RUTAS_PANEL, MEDIR_DESBORDE,
  abrirNavegador, entrarAlPanel, imprimir, rutaDeUnProducto,
} from './shared.mjs'

/** Enlaces sueltos dentro de un párrafo están exentos: solo se miden los que parecen botón. */
const CONTROLES_PEQUENOS = () => {
  const esControl = (e) =>
    /btn|chip|tab/.test((e.className || '').toString()) ||
    e.getAttribute('role') === 'button' ||
    e.tagName === 'BUTTON' ||
    e.closest('nav, footer') !== null
  return [...document.querySelectorAll('a[href], button')]
    .filter((e) => e.getClientRects().length > 0 && esControl(e) && !(e.className || '').toString().includes('sr-only'))
    .map((e) => ({
      t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 26),
      alto: Math.round(e.getBoundingClientRect().height),
    }))
    .filter((x) => x.alto < 44)
}

/**
 * Texto realmente cortado. Hay dos recortes legítimos que no son fallos y llenaban
 * el informe de ruido: el enlace "Saltar al contenido" (oculto salvo con el teclado)
 * y los acordeones cerrados, que colapsan a altura cero a propósito.
 */
const TEXTO_CORTADO = () =>
  [...document.querySelectorAll('h1, h2, h3, p, li, td, dd, button, a')]
    .filter((e) => {
      const r = e.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return false
      const cls = (e.className || '').toString()
      if (cls.includes('sr-only')) return false
      if (e.closest('[aria-hidden="true"]')) return false
      // dentro de una región plegada (grid-rows-[0fr] + overflow hidden)
      if (e.closest('[role="region"]')?.getBoundingClientRect().height === 0) return false
      const cs = getComputedStyle(e)
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return false
      // solo cuenta si de verdad se oculta parte del texto
      if (cs.overflowX === 'visible') return false
      return e.scrollWidth > e.clientWidth + 4
    })
    .map((e) => ({ t: (e.textContent || '').trim().slice(0, 34), sobra: e.scrollWidth - e.clientWidth }))
    .slice(0, 5)

const CTA_FUERA = () => {
  const b = [...document.querySelectorAll('a, button')].find((x) => /Ver el catálogo|Cotizar/.test(x.textContent))
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { abajo: Math.round(r.bottom), alto: window.innerHeight, texto: b.textContent.trim().slice(0, 24) }
}

export async function run() {
  const hallazgos = []
  const navegador = await abrirNavegador()
  const page = await navegador.newPage({ viewport: { width: 1440, height: 900 } })
  const ficha = await rutaDeUnProducto(page)
  await page.close()

  const publicas = [...RUTAS_PUBLICAS, ...(ficha ? [{ ruta: ficha, nombre: 'ficha de producto' }] : [])]

  for (const { w, h, nombre: tam } of ANCHOS) {
    const page = await navegador.newPage({ viewport: { width: w, height: h } })

    for (const { ruta, nombre } of publicas) {
      await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400)

      const desborde = await page.evaluate(MEDIR_DESBORDE)
      if (desborde > 1) {
        hallazgos.push({ gravedad: GRAVEDAD.alto, donde: `${nombre} (${tam} ${w}px)`, que: 'la página se arrastra de lado', detalle: `${desborde}px de más` })
      }

      for (const c of await page.evaluate(CONTROLES_PEQUENOS)) {
        hallazgos.push({ gravedad: GRAVEDAD.medio, donde: `${nombre} (${tam})`, que: `«${c.t}» mide ${c.alto}px de alto`, detalle: 'mínimo recomendado 44px para el dedo' })
      }

      for (const t of await page.evaluate(TEXTO_CORTADO)) {
        hallazgos.push({ gravedad: GRAVEDAD.alto, donde: `${nombre} (${tam})`, que: `texto cortado: «${t.t}»`, detalle: `se sale ${t.sobra}px` })
      }
    }

    // La portada tiene que enseñar sus botones sin bajar
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const cta = await page.evaluate(CTA_FUERA)
    if (cta && cta.abajo > cta.alto) {
      hallazgos.push({
        gravedad: GRAVEDAD.alto,
        donde: `portada (${tam} ${w}×${h})`,
        que: `el botón «${cta.texto}» queda fuera de la pantalla al entrar`,
        detalle: `acaba a ${cta.abajo}px y la pantalla mide ${cta.alto}px`,
      })
    }

    await page.close()
  }

  // Panel: solo donde más duele, en móvil y escritorio
  for (const { w, h, nombre: tam } of ANCHOS.filter((a) => a.w === 375 || a.w === 1440)) {
    const page = await navegador.newPage({ viewport: { width: w, height: h } })
    await entrarAlPanel(page)
    for (const { ruta, nombre } of RUTAS_PANEL) {
      await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
      const desborde = await page.evaluate(MEDIR_DESBORDE)
      if (desborde > 1) {
        hallazgos.push({ gravedad: GRAVEDAD.alto, donde: `${nombre} (${tam})`, que: 'la página se arrastra de lado', detalle: `${desborde}px de más` })
      }
    }
    await page.close()
  }

  // Menú móvil: tiene que taparlo todo y tener fondo
  const movil = await navegador.newPage({ viewport: { width: 375, height: 812 } })
  await movil.goto(BASE + '/', { waitUntil: 'networkidle' })
  await movil.click('button[aria-label="Abrir menú"]')
  await movil.waitForTimeout(600)
  const menu = await movil.evaluate(() => {
    const p = document.getElementById('menu-movil')
    if (!p) return null
    const r = p.getBoundingClientRect()
    return { alto: Math.round(r.height), fondo: getComputedStyle(p).backgroundColor }
  })
  if (!menu || menu.alto < 400 || menu.fondo === 'rgba(0, 0, 0, 0)') {
    hallazgos.push({
      gravedad: GRAVEDAD.critico,
      donde: 'menú móvil',
      que: 'el menú no se ve como debe (sin fondo o sin altura)',
      detalle: menu ? `alto ${menu.alto}px, fondo ${menu.fondo}` : 'no llega ni a aparecer',
    })
  }
  await movil.close()

  await navegador.close()
  return { titulo: 'Móvil, tablet y escritorio', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
