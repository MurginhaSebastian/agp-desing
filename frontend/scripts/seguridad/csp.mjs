import { pathToFileURL } from 'node:url'
/**
 * Que las cabeceras de seguridad no rompan la web.
 *
 * Una CSP mal puesta no da error: deja la página en blanco. Y no se puede comprobar mirando el
 * código, porque quien la manda es el servidor. Así que aquí se hace de verdad:
 *   1. compilar la web en modo demo (sin backend, para que las llamadas a localhost:8080 no
 *      ensucien el resultado: en producción la API va por https y la CSP la permite),
 *   2. levantar `vite preview`, que ahora sirve las cabeceras de `vercel.json`
 *      (ver `vite.config.ts`),
 *   3. recorrer las páginas con un navegador de verdad, escuchando los avisos de la CSP,
 *   4. y comprobar que cada página tiene contenido: una CSP que bloquea el script principal
 *      deja un hueco vacío sin quejarse en la consola del servidor.
 *
 * Se compila a `dist-seg/` para no pisar el `dist/` de siempre.
 */
import { spawn } from 'node:child_process'
import { GRAVEDAD, abrirNavegador, ejecutar, imprimir, leer, rutaRepo } from './comun.mjs'

/*
 * Puerto al azar a propósito. Con un puerto fijo, un servidor de una ejecución anterior que no
 * murió sigue respondiendo, el nuevo no puede arrancar y la prueba mide la web de antes: pasa
 * en verde sin haber comprobado nada. Pasó de verdad al probar este control.
 */
const PUERTO = Number(process.env.SEG_PUERTO ?? 4200 + Math.floor(Math.random() * 500))
const BASE = `http://localhost:${PUERTO}`
const SALIDA = 'dist-seg'

const PAGINAS = [
  { ruta: '/', nombre: 'portada' },
  { ruta: '/catalogo', nombre: 'catálogo' },
  { ruta: '/privacidad', nombre: 'privacidad' },
  { ruta: '/terminos', nombre: 'términos' },
  { ruta: '/admin/login', nombre: 'entrar al panel' },
  { ruta: '/no-existe-esta-pagina', nombre: 'página no encontrada' },
]

/**
 * PNG de 1×1 en memoria, para probar la subida sin dejar archivos por el disco.
 * (firma PNG + IHDR + IDAT + IEND, el mínimo que un navegador acepta como imagen)
 */
const PNG_DE_PRUEBA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
)

/** Recoge los avisos de la CSP desde el primer instante, antes de que cargue nada. */
const ESCUCHA = `
  window.__cspAvisos = []
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__cspAvisos.push({ directiva: e.violatedDirective, recurso: String(e.blockedURI).slice(0, 120) })
  })
`

/** La CSP tal como está escrita en vercel.json, para poder comparar con la servida. */
function cspDeVercel() {
  try {
    const json = JSON.parse(leer('frontend/vercel.json'))
    for (const bloque of json.headers ?? []) {
      for (const h of bloque.headers ?? []) {
        if (String(h.key).toLowerCase() === 'content-security-policy') return String(h.value)
      }
    }
  } catch {
    // sin vercel.json no hay con qué comparar
  }
  return null
}

function compilar() {
  // VITE_API_URL vacío = modo demo. process.env pesa más que frontend/.env.
  const r = ejecutar('npm', ['run', 'build', '--', '--outDir', SALIDA, '--emptyOutDir'], {
    cwd: rutaRepo('frontend'),
    timeout: 300_000,
    entorno: { VITE_API_URL: '' },
  })
  return r
}

function levantarPreview() {
  const hijo = spawn('npm', ['run', 'preview', '--', '--outDir', SALIDA, '--port', String(PUERTO), '--strictPort'], {
    cwd: rutaRepo('frontend'),
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  hijo.stdout.on('data', () => {})
  hijo.stderr.on('data', () => {})
  return hijo
}

async function esperarA(url, intentos = 40) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (r.ok) return r
    } catch {
      // todavía no
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return null
}

export async function run() {
  const hallazgos = []

  const compilacion = compilar()
  if (!compilacion.ok) {
    return {
      titulo: 'La web con sus cabeceras puestas',
      hallazgos: [{ gravedad: GRAVEDAD.medio, donde: 'compilación', que: 'no se pudo compilar la web para probarla', detalle: (compilacion.error ?? '').slice(0, 140) }],
    }
  }

  const servidor = levantarPreview()
  let navegador = null
  try {
    const arriba = await esperarA(BASE + '/')
    if (!arriba) {
      return {
        titulo: 'La web con sus cabeceras puestas',
        hallazgos: [{ gravedad: GRAVEDAD.medio, donde: 'servidor de prueba', que: `nada respondió en ${BASE}` }],
      }
    }

    /*
     * Antes de creerse nada: la CSP que sirve este servidor tiene que ser **exactamente** la
     * que hay escrita en vercel.json. Si no coincide, lo que se está midiendo no es la web que
     * se va a publicar, y un «sin hallazgos» no valdría nada.
     */
    const servida = arriba.headers.get('content-security-policy')
    const declarada = cspDeVercel()
    if (!servida) {
      return {
        titulo: 'La web con sus cabeceras puestas',
        hallazgos: [{ gravedad: GRAVEDAD.alto, donde: 'servidor de prueba', que: 'la CSP no llegó al navegador', detalle: 'revisa preview.headers en vite.config.ts' }],
      }
    }
    if (declarada && servida.trim() !== declarada.trim()) {
      return {
        titulo: 'La web con sus cabeceras puestas',
        hallazgos: [{
          gravedad: GRAVEDAD.medio,
          donde: 'servidor de prueba',
          que: 'no se pudo medir: la CSP servida no es la de vercel.json',
          detalle: `sirve «${servida.slice(0, 60)}…» y en vercel.json dice «${declarada.slice(0, 60)}…» — ¿hay otro servidor en el puerto?`,
        }],
      }
    }

    navegador = await abrirNavegador()
    const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
    await contexto.addInitScript(ESCUCHA)
    const page = await contexto.newPage()

    const erroresDeConsola = []
    page.on('console', (m) => {
      if (m.type() === 'error') erroresDeConsola.push(m.text().slice(0, 140))
    })

    const rutas = [...PAGINAS]
    // Una ficha de producto de verdad, que es la que carga imágenes de fuera
    await page.goto(BASE + '/catalogo', { waitUntil: 'networkidle' })
    const ficha = await page.getAttribute('a[href^="/catalogo/"]', 'href').catch(() => null)
    if (ficha) rutas.push({ ruta: ficha, nombre: 'ficha de un cuadro' })

    for (const p of rutas) {
      erroresDeConsola.length = 0
      await page.goto(BASE + p.ruta, { waitUntil: 'networkidle' })

      const avisos = await page.evaluate(() => window.__cspAvisos ?? [])
      for (const a of avisos) {
        hallazgos.push({
          gravedad: GRAVEDAD.alto,
          donde: p.nombre,
          que: `la CSP bloqueó algo que la página necesita (${a.directiva})`,
          detalle: a.recurso,
        })
      }

      // Página en blanco: el síntoma típico de una CSP que se come el script principal
      const contenido = await page.evaluate(() => ({
        texto: document.body.innerText.trim().length,
        nodos: document.querySelectorAll('main, nav, h1, h2').length,
      }))
      if (contenido.texto < 60 || contenido.nodos === 0) {
        hallazgos.push({
          gravedad: GRAVEDAD.critico,
          donde: p.nombre,
          que: 'la página se queda casi vacía con las cabeceras puestas',
          detalle: `${contenido.texto} caracteres de texto, ${contenido.nodos} elementos principales`,
        })
      }

      for (const e of erroresDeConsola.filter((t) => /Content Security Policy|Refused to/i.test(t))) {
        hallazgos.push({ gravedad: GRAVEDAD.alto, donde: p.nombre, que: 'la consola se queja de la CSP', detalle: e })
      }
    }

    /*
     * La vista previa al subir una foto usa una dirección `blob:`, que la CSP bloquea si no está
     * permitida en `img-src`. Se prueba de verdad: se entra al panel del modo demo, se elige una
     * imagen creada **en memoria** (nada de archivos sueltos por el disco) y se comprueba que la
     * miniatura se pinta y que la CSP no protestó.
     */
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' })
    await page.fill('input[type=text]', 'admin')
    await page.fill('input[type=password]', 'demo')
    await page.click('button[type=submit]')
    await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 10_000 }).catch(() => {})
    await page.goto(BASE + '/admin/cuadros/nuevo', { waitUntil: 'networkidle' })

    const entrada = await page.$('input[type=file]')
    if (!entrada) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'panel', que: 'no se encontró el campo para elegir la foto' })
    } else {
      await entrada.setInputFiles({ name: 'prueba.png', mimeType: 'image/png', buffer: PNG_DE_PRUEBA })
      const miniatura = await page.waitForSelector('figure img', { timeout: 5000 }).catch(() => null)
      const pintada = miniatura ? await miniatura.evaluate((el) => el.naturalWidth > 0 && el.getClientRects().length > 0) : false
      if (!pintada) {
        hallazgos.push({
          gravedad: GRAVEDAD.alto,
          donde: 'panel · subir foto',
          que: 'la vista previa de la foto no se ve con las cabeceras puestas',
          detalle: "seguramente falta blob: en img-src de la CSP",
        })
      }
      const avisos = await page.evaluate(() => window.__cspAvisos ?? [])
      for (const a of avisos) {
        hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'panel · subir foto', que: `la CSP bloqueó algo (${a.directiva})`, detalle: a.recurso })
      }
    }

    await contexto.close()
    return { titulo: 'La web con sus cabeceras puestas', hallazgos, nota: `${rutas.length} páginas y la subida de una foto, con las cabeceras de vercel.json` }
  } finally {
    if (navegador) await navegador.close().catch(() => {})
    /*
     * En Windows, `npm run preview` es un .cmd que arranca node aparte: matar al padre deja
     * vivo al que de verdad sirve el sitio, y la siguiente ejecución mediría ese servidor
     * viejo. `taskkill /T` se lleva el árbol entero.
     */
    if (process.platform === 'win32' && servidor.pid) {
      ejecutar('taskkill', ['/PID', String(servidor.pid), '/T', '/F'], { timeout: 20_000 })
    } else {
      servidor.kill()
    }
  }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  if (r.nota) console.log(`  (${r.nota})`)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
