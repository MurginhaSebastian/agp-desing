import { pathToFileURL } from 'node:url'
/**
 * Enlaces: que los de WhatsApp, Instagram y TikTok apunten a las cuentas reales,
 * que los internos lleven a algún sitio y que una dirección inventada muestre la
 * página propia y no el error en inglés de la librería.
 *
 * No se navega a las redes sociales: se comprueba la dirección escrita, que es lo
 * que se puede romper. Entrar a WhatsApp con el número real sería molestar al dueño.
 */
import { BASE, GRAVEDAD, abrirNavegador, entrarAlPanel, imprimir } from './shared.mjs'

const ESPERADOS = {
  whatsapp: /^https:\/\/wa\.me\/51977463110\?text=/,
  instagram: 'https://www.instagram.com/agp_desinger/',
  tiktok: 'https://www.tiktok.com/@agp.desing',
}

export async function run() {
  const hallazgos = []
  const navegador = await abrirNavegador()
  const page = await navegador.newPage({ viewport: { width: 1440, height: 900 } })

  for (const ruta of ['/', '/catalogo']) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    const enlaces = await page.$$eval('a[href]', (as) => as.map((a) => ({ href: a.href, rel: a.rel, target: a.target, t: a.textContent.trim().slice(0, 24) })))

    for (const e of enlaces.filter((x) => x.href.includes('wa.me'))) {
      if (!ESPERADOS.whatsapp.test(e.href)) {
        hallazgos.push({ gravedad: GRAVEDAD.critico, donde: ruta, que: 'el enlace de WhatsApp no apunta al número correcto', detalle: e.href.slice(0, 80) })
      }
    }
    for (const [red, esperado] of [['instagram', ESPERADOS.instagram], ['tiktok', ESPERADOS.tiktok]]) {
      for (const e of enlaces.filter((x) => x.href.includes(red))) {
        if (e.href !== esperado) {
          hallazgos.push({ gravedad: GRAVEDAD.alto, donde: ruta, que: `el enlace de ${red} no es el correcto`, detalle: `${e.href} en vez de ${esperado}` })
        }
      }
    }
    for (const e of enlaces.filter((x) => x.target === '_blank')) {
      if (!e.rel.includes('noopener')) {
        hallazgos.push({ gravedad: GRAVEDAD.medio, donde: ruta, que: `«${e.t}» abre en otra pestaña sin protección`, detalle: 'falta rel="noopener"' })
      }
    }
  }

  // Enlaces internos: que ninguno acabe en la página de "no encontrado"
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const internos = await page.$$eval('a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])
  for (const destino of internos) {
    await page.goto(BASE + destino, { waitUntil: 'networkidle' })
    const perdido = await page.evaluate(() => /Esta página no existe/.test(document.body.innerText))
    if (perdido) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'enlaces internos', que: `«${destino}» no lleva a ninguna parte` })
    }
  }

  // Dirección inventada: página propia, no el error de la librería
  await page.goto(BASE + '/una-direccion-que-no-existe', { waitUntil: 'networkidle' })
  const r = await page.evaluate(() => ({
    ingles: /Unexpected Application Error/i.test(document.body.innerText),
    conMenu: !!document.querySelector('nav[aria-label="Principal"]'),
  }))
  if (r.ingles || !r.conMenu) {
    hallazgos.push({ gravedad: GRAVEDAD.critico, donde: 'dirección inventada', que: 'no aparece la página de "no encontrado" propia', detalle: r.ingles ? 'sale el error en inglés de la librería' : 'sale sin menú' })
  }

  // El pie debe enlazar a las páginas legales
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  for (const legal of ['/privacidad', '/terminos']) {
    const hay = await page.$(`footer a[href="${legal}"]`)
    if (!hay) hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'pie de página', que: `falta el enlace a ${legal}` })
  }

  // Panel: que no haya enlaces rotos tras entrar
  await entrarAlPanel(page)
  for (const destino of ['/admin', '/admin/portada', '/admin/cuadros/nuevo']) {
    await page.goto(BASE + destino, { waitUntil: 'networkidle' })
    const perdido = await page.evaluate(() => /Esta página no existe/.test(document.body.innerText))
    if (perdido) hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'panel', que: `«${destino}» no lleva a ninguna parte` })
  }

  await navegador.close()
  return { titulo: 'Enlaces', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
