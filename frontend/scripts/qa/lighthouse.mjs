import { pathToFileURL } from 'node:url'
/**
 * Lighthouse: rendimiento, accesibilidad, buenas prácticas y SEO.
 * Se ejecuta contra el servidor de desarrollo, así que la nota de rendimiento sale
 * más baja de lo que saldrá publicada (Vite sirve los módulos sin empaquetar).
 * Para una medida de verdad: `npm run build && npm run preview` y luego QA_BASE=...
 */
import { existsSync } from 'node:fs'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { BASE, GRAVEDAD, imprimir } from './shared.mjs'

const PAGINAS = [
  { ruta: '/', nombre: 'portada' },
  { ruta: '/catalogo', nombre: 'catálogo' },
  { ruta: '/privacidad', nombre: 'privacidad' },
]

const MINIMOS = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.9, seo: 0.9 }

/**
 * Contra el servidor de desarrollo la nota de rendimiento no significa nada: Vite
 * sirve cientos de módulos sueltos. En ese caso se informa, pero no se exige.
 * La medida buena: `npm run build && npm run preview` y QA_BASE=http://localhost:4173
 */
const EN_DESARROLLO = BASE.includes(':5173')
const NOMBRES = { performance: 'rendimiento', accessibility: 'accesibilidad', 'best-practices': 'buenas prácticas', seo: 'SEO' }

export async function run() {
  const hallazgos = []
  // En esta máquina no hay Chrome, solo Edge: chrome-launcher no lo encuentra solo.
  // Barras normales a propósito: Node las acepta en Windows y evitan el lío de escapes.
  const EDGE = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ]
  const detectado = (() => {
    try {
      return chromeLauncher.Launcher.getFirstInstallation()
    } catch {
      return undefined
    }
  })()
  const navegadorPath = process.env.QA_CHROME_PATH ?? detectado ?? EDGE.find((p) => existsSync(p))

  let chrome
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless=new', '--no-sandbox'],
      chromePath: navegadorPath,
    })
  } catch (e) {
    return {
      titulo: 'Lighthouse',
      hallazgos: [{ gravedad: GRAVEDAD.bajo, donde: 'la propia prueba', que: 'no se pudo abrir un navegador para Lighthouse', detalle: String(e).slice(0, 120) }],
    }
  }

  for (const { ruta, nombre } of PAGINAS) {
    const r = await lighthouse(BASE + ruta, { port: chrome.port, output: 'json', logLevel: 'error' })
    const cat = r.lhr.categories

    for (const [clave, minimo] of Object.entries(MINIMOS)) {
      const nota = cat[clave]?.score ?? 0
      if (nota < minimo) {
        const soloInformativo = clave === 'performance' && EN_DESARROLLO
        hallazgos.push({
          gravedad: soloInformativo ? GRAVEDAD.bajo : clave === 'accessibility' ? GRAVEDAD.alto : GRAVEDAD.medio,
          donde: nombre,
          que: `${NOMBRES[clave]}: ${Math.round(nota * 100)} sobre 100`,
          detalle: soloInformativo
            ? 'medido en desarrollo, no es representativo: usar npm run preview'
            : `el mínimo que nos ponemos es ${Math.round(minimo * 100)}`,
        })
      }
    }

    // Los fallos concretos de accesibilidad y SEO valen más que la nota
    for (const clave of ['accessibility', 'seo']) {
      for (const id of cat[clave]?.auditRefs?.map((a) => a.id) ?? []) {
        const a = r.lhr.audits[id]
        if (a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable') {
          hallazgos.push({ gravedad: GRAVEDAD.medio, donde: `${nombre} · ${NOMBRES[clave]}`, que: a.title, detalle: (a.description ?? '').split('. ')[0].slice(0, 110) })
        }
      }
    }
  }

  await chrome.kill()
  return { titulo: 'Lighthouse (rendimiento, SEO, buenas prácticas)', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
