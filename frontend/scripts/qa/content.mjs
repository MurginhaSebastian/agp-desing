import { pathToFileURL } from 'node:url'
/**
 * Textos: que no queden restos del negocio anterior, que la marca se escriba igual
 * en todas partes y que los textos que el dueño fijó sigan ahí.
 * Mira el código fuente y además lo que ve un visitante en pantalla.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { BASE, GRAVEDAD, abrirNavegador, imprimir } from './shared.mjs'

const RAIZ = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

/** Palabras del negocio anterior (pintura al óleo). Se buscan sin distinguir mayúsculas. */
const PROHIBIDAS = [
  'pintad', 'pintamos', 'óleo', 'acrílico', 'lienzo', 'la pared', 'colgar', 'colgado', 'cuelgas',
  'Cargando obra',
]

/**
 * La marca se escribe «AGP Desing». Estas variantes SÍ distinguen mayúsculas:
 * buscarlas sin distinguir marcaría como error la forma correcta.
 */
const MARCA_MAL = ['AGP desing', 'AGP DESING', 'AGP Design', 'Agp Desing']

/** Textos que el dueño fijó y no pueden desaparecer. */
const OBLIGATORIOS = [
  { donde: '/', texto: 'Detalles únicos' },
  { donde: '/', texto: 'Nuestros diseños' },
  { donde: '/', texto: 'Detalles únicos, ensamblados a mano.' },
  { donde: '/catalogo', texto: 'El Catálogo.' },
  { donde: '/catalogo', texto: 'Explora nuestras piezas o inspírate para crear la tuya desde cero.' },
  { donde: '/catalogo/no-existe-xyz', texto: 'Ese diseño aún no existe' },
]

const TITULO_ESPERADO = 'AGP Desing - Regalos con intención'

function archivosFuente(dir, salida = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) archivosFuente(p, salida)
    else if (/\.(tsx?|html)$/.test(n)) salida.push(p)
  }
  return salida
}

export async function run() {
  const hallazgos = []

  // --- en el código
  const archivos = [...archivosFuente(join(RAIZ, 'src')), join(RAIZ, 'index.html')]
  for (const archivo of archivos) {
    const texto = readFileSync(archivo, 'utf8')
    texto.split('\n').forEach((linea, i) => {
      // los datos de ejemplo del modo demo describen productos, no son textos de la web
      if (archivo.includes('mock-products')) return
      // los comentarios no los ve nadie, y «pared de galería» es como el propio
      // proyecto llama a la rejilla escalonada (está así en CLAUDE.md)
      const limpia = linea.trim()
      if (limpia.startsWith('//') || limpia.startsWith('*') || limpia.startsWith('/*') || limpia.startsWith('{/*')) return
      for (const mala of PROHIBIDAS) {
        if (linea.toLowerCase().includes(mala.toLowerCase())) {
          hallazgos.push({
            gravedad: GRAVEDAD.medio,
            donde: `${relative(RAIZ, archivo)}:${i + 1}`,
            que: `queda «${mala}» del negocio anterior`,
            detalle: linea.trim().slice(0, 90),
          })
        }
      }
      for (const mala of MARCA_MAL) {
        if (linea.includes(mala)) {
          hallazgos.push({
            gravedad: GRAVEDAD.alto,
            donde: `${relative(RAIZ, archivo)}:${i + 1}`,
            que: `la marca está escrita «${mala}»`,
            detalle: 'se escribe «AGP Desing»',
          })
        }
      }
    })
  }

  // --- en pantalla
  const navegador = await abrirNavegador()
  const page = await navegador.newPage({ viewport: { width: 1440, height: 900 } })

  for (const { donde, texto } of OBLIGATORIOS) {
    await page.goto(BASE + donde, { waitUntil: 'networkidle' })
    const hay = await page.evaluate((t) => document.body.innerText.includes(t), texto)
    if (!hay) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde, que: `falta el texto «${texto}»` })
    }
  }

  // El título de la pestaña se estropeaba al volver de una ficha
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const inicial = await page.title()
  if (inicial !== TITULO_ESPERADO) {
    hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'pestaña del navegador', que: `dice «${inicial}»`, detalle: `debería decir «${TITULO_ESPERADO}»` })
  }
  const ficha = await page.getAttribute('a[href^="/catalogo/"]', 'href').catch(() => null)
  if (ficha) {
    await page.goto(BASE + ficha, { waitUntil: 'networkidle' })
    await page.goBack({ waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const despues = await page.title()
    if (despues !== TITULO_ESPERADO) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'pestaña del navegador', que: `al volver de una ficha cambia a «${despues}»`, detalle: `debería seguir en «${TITULO_ESPERADO}»` })
    }
  }

  await navegador.close()
  return { titulo: 'Textos y coherencia de la marca', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
