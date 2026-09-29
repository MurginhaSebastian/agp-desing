import { pathToFileURL } from 'node:url'
/**
 * Lo que se ve de la base de datos desde internet.
 *
 * Supabase publica el esquema `public` por su propia API REST, y cualquiera puede
 * llamarla con la clave «publishable», que es pública por diseño (va dentro de los
 * navegadores). La única barrera es el RLS de cada tabla. Aquí se pregunta tabla por
 * tabla, exactamente como lo haría un desconocido.
 *
 * Solo se lee. No se prueba escribir: tocar `flyway_schema_history` dejaría el backend
 * sin arrancar. Si la lectura ya está abierta, se avisa y se arregla igual.
 *
 * La clave se lee de `backend/.env` (SUPABASE_PUBLISHABLE_KEY) o del entorno; no se
 * guarda en el repositorio y no se imprime nunca.
 */
import { GRAVEDAD, imprimir, supabase, variablesEnv } from './comun.mjs'

/** PNG de 1x1, para probar si un desconocido puede escribir en el bucket. */
const PNG_MINIMO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
)
const NOMBRE_DE_PRUEBA = 'zz-prueba-de-seguridad.png'

/** Tablas propias más las que crean las herramientas y se olvidan. */
const TABLAS = [
  { nombre: 'products', gravedad: GRAVEDAD.alto },
  { nombre: 'admin_users', gravedad: GRAVEDAD.critico },
  { nombre: 'site_settings', gravedad: GRAVEDAD.medio },
  { nombre: 'flyway_schema_history', gravedad: GRAVEDAD.medio },
]

export async function run() {
  const cfg = supabase()
  if (!cfg.listo) {
    return {
      titulo: 'Base de datos vista desde fuera',
      hallazgos: [{
        gravedad: GRAVEDAD.bajo,
        donde: 'Supabase',
        que: 'no se pudo comprobar: falta la dirección o la clave pública',
        detalle: 'añade SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY a backend/.env (no es un secreto, pero ese archivo no se sube)',
      }],
    }
  }

  const hallazgos = []
  for (const t of TABLAS) {
    let respuesta
    try {
      const r = await fetch(`${cfg.url}/rest/v1/${t.nombre}?select=*&limit=3`, {
        headers: { apikey: cfg.clave, Authorization: `Bearer ${cfg.clave}` },
        signal: AbortSignal.timeout(20_000),
      })
      respuesta = { estado: r.status, cuerpo: await r.text() }
    } catch (e) {
      hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: t.nombre, que: 'no se pudo preguntar', detalle: String(e.message ?? e) })
      continue
    }

    // 401/403/404 = la API no la sirve. 200 con [] = la sirve pero el RLS no deja ver nada.
    if (respuesta.estado !== 200) continue

    let filas
    try { filas = JSON.parse(respuesta.cuerpo) } catch { filas = null }
    if (Array.isArray(filas) && filas.length > 0) {
      const columnas = Object.keys(filas[0]).slice(0, 6).join(', ')
      hallazgos.push({
        gravedad: t.gravedad,
        donde: t.nombre,
        que: 'cualquiera puede leer esta tabla desde internet con la clave pública',
        detalle: `${filas.length} fila(s) devueltas; columnas: ${columnas}`,
      })
    }
  }

  hallazgos.push(...await revisarElBucket(cfg))

  return {
    titulo: 'Base de datos vista desde fuera',
    hallazgos,
    nota: 'una respuesta vacía significa que el RLS funciona, no que la tabla no exista',
  }
}

/**
 * El almacén de fotos es un bucket **público**: cualquiera puede ver lo que hay dentro, y eso es
 * lo que se busca. Lo que no debe poder nadie es **escribir**. El backend sube con la clave
 * secreta, que se salta las políticas; con la clave pública —la que va dentro de los navegadores
 * y por tanto tiene cualquiera— la subida tiene que fallar.
 *
 * Esta es la única comprobación de la suite que intenta escribir. Se hace porque preguntando no
 * se sabe: las políticas de Storage no se pueden leer desde fuera. Si por desgracia la subida
 * funciona, se borra el archivo en el acto con la clave secreta.
 */
async function revisarElBucket(cfg) {
  const env = variablesEnv('backend/.env')
  /*
   * `productos` es el mismo valor por defecto que usa el backend (`app.storage.bucket`), así que
   * hay que ponerlo también aquí. Antes, si la variable no estaba escrita en `backend/.env` —que
   * es lo normal, porque el backend no la necesita— este control **se saltaba sin decir nada** y
   * la auditoría salía en verde sin haber comprobado quién puede escribir en el almacén.
   */
  const bucket = process.env.SUPABASE_BUCKET ?? env.SUPABASE_BUCKET ?? 'productos'

  const destino = `${cfg.url}/storage/v1/object/${bucket}/${NOMBRE_DE_PRUEBA}`
  let respuesta
  try {
    respuesta = await fetch(destino, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.clave}`, apikey: cfg.clave, 'Content-Type': 'image/png' },
      body: PNG_MINIMO,
      signal: AbortSignal.timeout(20_000),
    })
  } catch (e) {
    return [{ gravedad: GRAVEDAD.bajo, donde: `bucket ${bucket}`, que: 'no se pudo comprobar quién puede escribir', detalle: String(e.message ?? e) }]
  }

  if (!respuesta.ok) return []

  // Salió bien, que es justo lo que no debería: se borra y se avisa.
  const secreta = process.env.SUPABASE_SERVICE_KEY ?? env.SUPABASE_SERVICE_KEY
  let limpiado = 'queda en el bucket, bórralo a mano'
  if (secreta) {
    const d = await fetch(destino, { method: 'DELETE', headers: { Authorization: `Bearer ${secreta}`, apikey: secreta } }).catch(() => null)
    if (d && d.ok) limpiado = 'el archivo de prueba ya se borró'
  }
  return [{
    gravedad: GRAVEDAD.critico,
    donde: `bucket ${bucket}`,
    que: 'cualquiera puede subir archivos al almacén de fotos con la clave pública',
    detalle: `quita el permiso de escritura a anon en Storage → Policies (${limpiado})`,
  }]
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  if (r.nota) console.log(`  (${r.nota})`)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
