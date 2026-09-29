/**
 * Piezas comunes de la auditoría de seguridad.
 * Reutiliza lo que ya existía en la suite de calidad (gravedades, informe, credenciales)
 * para que los dos informes se lean igual.
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

export { GRAVEDAD, ordenar, imprimir, BASE, API, ADMIN, abrirNavegador, nuevaPagina } from '../qa/shared.mjs'

/** Raíz del repositorio, desde este archivo. */
export const RAIZ = new URL('../../../', import.meta.url)

export function rutaRepo(relativa) {
  return new URL(relativa, RAIZ)
}

/** Lee un archivo del repositorio; devuelve null si no está. */
export function leer(relativa) {
  try {
    return readFileSync(rutaRepo(relativa), 'utf8')
  } catch {
    return null
  }
}

/** Variables de un archivo .env, sin comentarios. Los valores nunca se imprimen. */
export function variablesEnv(relativa) {
  const texto = leer(relativa)
  if (!texto) return {}
  const out = {}
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

/**
 * Datos del proyecto de Supabase para poder preguntarle desde fuera, como lo haría
 * cualquiera. La clave «publishable» es pública por diseño (va en navegadores), pero no
 * se guarda en el repositorio: se lee de `backend/.env` o del entorno. Sin ella, la
 * comprobación se salta y lo dice.
 */
export function supabase() {
  const env = variablesEnv('backend/.env')
  const clave = process.env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY ?? ''
  let url = process.env.SUPABASE_URL ?? env.SUPABASE_URL ?? ''
  if (!url) {
    // DB_USER tiene la forma postgres.<ref>; de ahí sale la URL de la API REST.
    const ref = (env.DB_USER ?? '').split('.')[1]
    if (ref) url = `https://${ref}.supabase.co`
  }
  return { url: url.replace(/\/$/, ''), clave, listo: Boolean(url && clave) }
}

/**
 * Ejecuta un comando y devuelve su salida; nunca lanza.
 * `opciones.entorno` añade variables al entorno del proceso hijo (las de `process.env`
 * siguen estando, para no dejar al comando sin PATH).
 */
export function ejecutar(comando, args, opciones = {}) {
  try {
    return {
      ok: true,
      salida: execFileSync(comando, args, {
        encoding: 'utf8',
        cwd: opciones.cwd ?? rutaRepo('.'),
        env: opciones.entorno ? { ...process.env, ...opciones.entorno } : process.env,
        maxBuffer: 32 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        timeout: opciones.timeout ?? 180_000,
      }),
    }
  } catch (e) {
    return { ok: false, salida: (e.stdout ?? '') + (e.stderr ?? ''), error: String(e.message ?? e) }
  }
}

/** fetch que no lanza: devuelve { estado, cabeceras, cuerpo } o { error }. */
export async function pedir(url, opciones = {}) {
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(opciones.timeoutMs ?? 15_000), ...opciones })
    const cuerpo = await r.text().catch(() => '')
    const cabeceras = {}
    r.headers.forEach((v, k) => { cabeceras[k.toLowerCase()] = v })
    return { estado: r.status, cabeceras, cuerpo }
  } catch (e) {
    return { error: String(e.message ?? e) }
  }
}

/** ¿Responde algo en esa dirección? */
export async function estaEnMarcha(url) {
  const r = await pedir(url, { timeoutMs: 4000 })
  return r.error === undefined
}
