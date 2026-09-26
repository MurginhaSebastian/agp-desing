import { pathToFileURL } from 'node:url'
/**
 * Accesibilidad con axe-core, en todas las rutas y en los estados que solo existen
 * al interactuar (menú abierto, diálogo de borrado, formulario con errores). Esos
 * estados son justo donde se escondían los fallos.
 */
import AxeBuilder from '@axe-core/playwright'
import {
  BASE, GRAVEDAD, RUTAS_PUBLICAS, RUTAS_PANEL,
  abrirNavegador, entrarAlPanel, imprimir, nuevaPagina, rutaDeUnProducto,
} from './shared.mjs'

const MAPA = { critical: GRAVEDAD.critico, serious: GRAVEDAD.alto, moderate: GRAVEDAD.medio, minor: GRAVEDAD.bajo }

async function analizar(page, donde, hallazgos) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()

  for (const v of violations) {
    hallazgos.push({
      gravedad: MAPA[v.impact] ?? GRAVEDAD.bajo,
      donde,
      que: v.help,
      detalle: `${v.nodes.length} elemento(s): ${v.nodes[0]?.target?.join(' ') ?? ''} — ${v.helpUrl}`,
    })
  }
}

export async function run() {
  const hallazgos = []
  const navegador = await abrirNavegador()
  const { page, cerrar } = await nuevaPagina(navegador)

  // Autocomprobación: axe tiene que cazar un fallo evidente antes de fiarnos de un "0".
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    const img = document.createElement('img')
    img.src = '/favicon.svg'
    img.id = 'qa-autocomprobacion'
    document.body.prepend(img)
  })
  const prueba = await new AxeBuilder({ page }).include('#qa-autocomprobacion').analyze()
  if (prueba.violations.length === 0) {
    hallazgos.push({
      gravedad: GRAVEDAD.critico,
      donde: 'la propia prueba',
      que: 'axe no detecta un fallo conocido: el resultado no es de fiar',
      detalle: 'una imagen sin texto alternativo debería salir como infracción',
    })
  }
  await page.evaluate(() => document.getElementById('qa-autocomprobacion')?.remove())

  const ficha = await rutaDeUnProducto(page)
  const publicas = [...RUTAS_PUBLICAS, ...(ficha ? [{ ruta: ficha, nombre: 'ficha de producto' }] : [])]

  for (const { ruta, nombre } of publicas) {
    for (const ancho of [375, 1440]) {
      await page.setViewportSize({ width: ancho, height: 900 })
      await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
      await analizar(page, `${nombre} (${ancho})`, hallazgos)
    }
  }

  // Menú móvil abierto
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.click('button[aria-label="Abrir menú"]')
  await page.waitForTimeout(600)
  await analizar(page, 'menú móvil abierto', hallazgos)

  // Panel
  await page.setViewportSize({ width: 1440, height: 900 })
  await entrarAlPanel(page)
  for (const { ruta, nombre } of RUTAS_PANEL.filter((r) => r.ruta !== '/admin/login')) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    await analizar(page, nombre, hallazgos)
  }

  // Formulario con errores a la vista
  await page.goto(BASE + '/admin/cuadros/nuevo', { waitUntil: 'networkidle' })
  await page.click('button[type=submit]')
  await page.waitForTimeout(400)
  await analizar(page, 'formulario con errores', hallazgos)

  // Diálogo de borrado, si hay algún producto
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' })
  const borrar = await page.$('button[aria-label^="Eliminar"]')
  if (borrar) {
    await borrar.click()
    await page.waitForSelector('[role=alertdialog]')
    await analizar(page, 'diálogo de borrado', hallazgos)
  }

  await cerrar()
  await navegador.close()
  return { titulo: 'Accesibilidad (axe-core)', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
