import { pathToFileURL } from 'node:url'
/**
 * Cabeceras de seguridad.
 *
 * Ojo: en local NO se pueden medir las de la web. Las pone Vercel al servirla, y ni
 * `npm run dev` ni `vite preview` leen `vercel.json`. Así que aquí se hacen dos cosas
 * distintas y se dice cuál es cuál:
 *   1. revisar que `vercel.json` declare las que hacen falta (esto siempre se puede);
 *   2. si existe la variable SEG_URL_PUBLICA, pedir esa dirección de verdad y mirar
 *      lo que llega (esto es la prueba real, y solo sirve cuando ya está publicada).
 * Las de la API sí se miden de verdad contra el backend local.
 */
import { API, GRAVEDAD, imprimir, leer, pedir } from './comun.mjs'

/** Lo que debe declarar la web. La comprobación es «está y dice lo esperado». */
const WEB = [
  { clave: 'content-security-policy', gravedad: GRAVEDAD.alto, debe: /default-src/i, nombre: 'Content-Security-Policy', para: 'limita de dónde puede cargar la página' },
  { clave: 'content-security-policy', gravedad: GRAVEDAD.alto, debe: /frame-ancestors\s+'none'/i, nombre: "CSP frame-ancestors 'none'", para: 'evita que metan la web en un iframe ajeno' },
  { clave: 'x-content-type-options', gravedad: GRAVEDAD.medio, debe: /nosniff/i, nombre: 'X-Content-Type-Options', para: 'el navegador no adivina el tipo de archivo' },
  { clave: 'referrer-policy', gravedad: GRAVEDAD.medio, debe: /strict-origin|no-referrer|same-origin/i, nombre: 'Referrer-Policy', para: 'no se filtra la página exacta al salir a otro sitio' },
  { clave: 'permissions-policy', gravedad: GRAVEDAD.bajo, debe: /camera=\(\)/i, nombre: 'Permissions-Policy', para: 'nadie pide cámara ni micrófono desde la web' },
  { clave: 'strict-transport-security', gravedad: GRAVEDAD.medio, debe: /max-age=\d{6,}/i, nombre: 'Strict-Transport-Security', para: 'el navegador se niega a entrar sin cifrar' },
]

const APIS = [
  { clave: 'content-security-policy', gravedad: GRAVEDAD.medio, debe: /default-src\s+'none'/i, nombre: "CSP default-src 'none'" },
  { clave: 'x-content-type-options', gravedad: GRAVEDAD.medio, debe: /nosniff/i, nombre: 'X-Content-Type-Options' },
  { clave: 'x-frame-options', gravedad: GRAVEDAD.bajo, debe: /deny|sameorigin/i, nombre: 'X-Frame-Options' },
  { clave: 'cache-control', gravedad: GRAVEDAD.bajo, debe: /no-store|no-cache|max-age=0/i, nombre: 'Cache-Control' },
]

function declaradasEnVercel() {
  const texto = leer('frontend/vercel.json')
  if (!texto) return null
  let json
  try { json = JSON.parse(texto) } catch { return null }
  const out = {}
  for (const bloque of json.headers ?? []) {
    for (const h of bloque.headers ?? []) out[String(h.key).toLowerCase()] = String(h.value)
  }
  return out
}

export async function run() {
  const hallazgos = []

  // 1. Lo que declara vercel.json
  const declaradas = declaradasEnVercel()
  if (declaradas === null) {
    hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'vercel.json', que: 'no se pudo leer la configuración de la web' })
  } else {
    for (const c of WEB) {
      const valor = declaradas[c.clave]
      if (!valor) {
        hallazgos.push({ gravedad: c.gravedad, donde: 'web (vercel.json)', que: `falta ${c.nombre}`, detalle: c.para })
      } else if (!c.debe.test(valor)) {
        hallazgos.push({ gravedad: c.gravedad, donde: 'web (vercel.json)', que: `${c.nombre} no dice lo esperado`, detalle: valor.slice(0, 90) })
      }
    }
    const csp = declaradas['content-security-policy'] ?? ''
    if (/unsafe-eval/i.test(csp)) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'web (vercel.json)', que: "la CSP permite 'unsafe-eval'", detalle: 'quita esa parte: deja ejecutar código montado al vuelo' })
    }
    if (/script-src[^;]*unsafe-inline/i.test(csp)) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'web (vercel.json)', que: "la CSP permite scripts pegados en el HTML ('unsafe-inline')", detalle: 'con eso la CSP casi no protege' })
    }
  }

  // 2. La web publicada, si se indica cuál
  const publica = process.env.SEG_URL_PUBLICA
  if (publica) {
    const r = await pedir(publica)
    if (r.error) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'web publicada', que: 'no respondió', detalle: r.error })
    } else {
      for (const c of WEB) {
        const valor = r.cabeceras[c.clave]
        if (!valor || !c.debe.test(valor)) {
          hallazgos.push({ gravedad: c.gravedad, donde: 'web publicada', que: `${c.nombre} no llega al navegador`, detalle: valor ? valor.slice(0, 80) : 'la cabecera no viene' })
        }
      }
    }
  }

  // 3. La API, medida de verdad
  const r = await pedir(`${API}/api/products`)
  if (r.error) {
    hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'API', que: 'el backend no respondió, no se pudieron medir sus cabeceras', detalle: r.error })
  } else {
    for (const c of APIS) {
      const valor = r.cabeceras[c.clave]
      if (!valor || !c.debe.test(valor)) {
        hallazgos.push({ gravedad: c.gravedad, donde: 'API', que: `${c.nombre} no viene o no dice lo esperado`, detalle: valor ? valor.slice(0, 80) : 'la cabecera no viene' })
      }
    }
    for (const filtrada of ['server', 'x-powered-by']) {
      if (r.cabeceras[filtrada]) {
        hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'API', que: `dice con qué está hecha (${filtrada})`, detalle: r.cabeceras[filtrada].slice(0, 40) })
      }
    }
  }

  return { titulo: 'Cabeceras de seguridad', hallazgos, nota: publica ? undefined : 'las de la web solo se comprobaron en vercel.json; para medirlas de verdad: SEG_URL_PUBLICA=https://tu-web' }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  if (r.nota) console.log(`  (${r.nota})`)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
