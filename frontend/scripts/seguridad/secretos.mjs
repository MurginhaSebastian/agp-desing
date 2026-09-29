import { pathToFileURL } from 'node:url'
/**
 * Que no haya nada privado dentro del repositorio: ni claves ni los datos de contacto.
 *
 * Mira cuatro sitios, porque olvidarse del segundo es el error clásico:
 *   1. los archivos que git tiene registrados hoy,
 *   2. **todo el historial** (borrar algo en un commit nuevo no lo quita de los viejos),
 *   3. que los `.env` sigan ignorados y sin registrar,
 *   4. restos de una reescritura de historial, que mantienen vivos los commits viejos.
 *
 * Los valores reales salen de `frontend/.env`, que no se sube. Aquí se usan solo para
 * buscarlos: no se imprimen nunca, solo el archivo o el commit donde aparecen.
 *
 * Los patrones van en sintaxis POSIX ([[:space:]] y no \s) porque los ejecuta `git grep`,
 * que no entiende las abreviaturas de Perl.
 */
import { GRAVEDAD, ejecutar, imprimir, leer, variablesEnv } from './comun.mjs'

const PATRONES = [
  { nombre: 'clave privada', regex: 'BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY', gravedad: GRAVEDAD.critico },
  { nombre: 'clave secreta de Supabase', regex: 'sb_secret_[A-Za-z0-9_-]{10,}', gravedad: GRAVEDAD.critico },
  { nombre: 'clave service_role de Supabase', regex: 'service_role["\']?[[:space:]]*[:=][[:space:]]*["\']?eyJ', gravedad: GRAVEDAD.critico },
  { nombre: 'clave de AWS', regex: 'AKIA[0-9A-Z]{16}', gravedad: GRAVEDAD.critico },
  { nombre: 'token de GitHub', regex: 'gh[pousr]_[A-Za-z0-9]{20,}', gravedad: GRAVEDAD.critico },
  { nombre: 'cadena de conexión con contraseña', regex: 'postgres(ql)?://[^[:space:]:]+:[^[:space:]@]{4,}@', gravedad: GRAVEDAD.critico },
  { nombre: 'JWT_SECRET con valor', regex: 'JWT_SECRET[[:space:]]*=[[:space:]]*[^[:space:]#]{8,}', gravedad: GRAVEDAD.critico },
  { nombre: 'contraseña de base de datos con valor', regex: 'DB_PASSWORD[[:space:]]*=[[:space:]]*[^[:space:]#]{6,}', gravedad: GRAVEDAD.alto },
  { nombre: 'hash de contraseña de administrador', regex: 'ADMIN_PASSWORD_HASH[[:space:]]*=[[:space:]]*[$]2', gravedad: GRAVEDAD.alto },
]

/*
 * Contraseñas y claves escritas a mano dentro del código.
 *
 * Esto es lo que se me escapó: los patrones de arriba buscan claves con **formato de máquina**
 * (`sb_secret_…`, `AKIA…`, tokens de GitHub), y una contraseña que escoge una persona no tiene
 * formato ninguno. `shared.mjs` llevaba la contraseña real del panel como valor por defecto de
 * `QA_ADMIN_PASS`, en un repositorio público, y el control dijo «sin hallazgos».
 *
 * La pista que sí se puede buscar no es el valor, es **la forma**: una variable cuyo nombre suena
 * a credencial con un valor literal al lado. Se buscan las tres maneras de escribirlo en este
 * proyecto: valor por defecto de una variable de entorno (`?? 'x'`, `|| 'x'`), asignación directa
 * (`password: 'x'`) y constante en Java (`String CLAVE = "x"`).
 */
const NOMBRES_DE_CREDENCIAL = 'PASS|PASSWORD|CLAVE|SECRET|SECRETO|TOKEN|APIKEY|API_KEY|CREDENTIAL'
const CREDENCIALES_A_MANO = [
  {
    nombre: 'una contraseña escrita como valor por defecto',
    // process.env.ALGO_PASS ?? 'lo que sea'   |   process.env.X_TOKEN || "lo que sea"
    // `[?|]{2}` cubre `??` y `||` sin tener que escapar nada: los patrones los ejecuta
    // `git grep -E`, y una contrabarra de más ahí dentro deja de buscar lo que parece.
    regex: `(${NOMBRES_DE_CREDENCIAL})[A-Z_]*.{0,20}[?|]{2}[[:space:]]*['"][^'"]{6,}['"]`,
    gravedad: GRAVEDAD.critico,
  },
  {
    nombre: 'una contraseña asignada a mano',
    // password: 'loquesea'   |   secret = "loquesea"   (no vale si el valor es ${una variable})
    // Ojo con el orden dentro de los corchetes: `${` seguidos abrirían una interpolación
    // de JavaScript dentro de este mismo texto. Por eso va `{` antes que `$`.
    //
    // Aquí NO entra `clave` a secas: en este proyecto significa casi siempre «nombre de campo»
    // (`{ clave: 'content-security-policy' }`), y meterla llenaba el informe de ruido. Un
    // control que avisa de veinte cosas inofensivas consigue que no se lea ninguna.
    regex: `(PASS|PASSWORD|CONTRASENA|SECRET|SECRETO|APIKEY|API_KEY|CREDENTIAL|password|secret)[A-Za-z_]*[[:space:]]*[:=][[:space:]]*['"][^'"{$]{6,}['"]`,
    gravedad: GRAVEDAD.alto,
  },
]

/*
 * Valores que a la vista son de mentira. Se descartan porque este proyecto está lleno de ellos
 * a propósito: los controles de seguridad prueban contraseñas equivocadas, el modo demo usa un
 * token falso y la documentación explica dónde va cada cosa con un hueco.
 */
// Se añaden sobre la marcha los que van apareciendo: un valor que es el nombre de la propia
// variable (QA_ADMIN_PASS) o un token declaradamente inventado no son credenciales.
const PINTA_DE_MENTIRA = /ejemplo|demo|mock|prueba|equivocada|loquesea|no[-.]es|inventad|fake|dummy|xxxx|<[^>]*>|tu-clave|placeholder|cambia(me|r)|NO_ESCRITA|_PASS.\{0,3\}[)'"]|RETIRADA/i

/** Archivos cuyo trabajo es contener ejemplos de credenciales: si no, se denuncian a sí mismos. */
const ARCHIVOS_CON_EJEMPLOS = [
  'frontend/scripts/seguridad/secretos.mjs',
  '.claude/skills/',
]

/*
 * Lo que se deja fuera y por qué:
 *  - *.env.example: son plantillas con los huecos vacíos; ahí los nombres deben aparecer.
 *  - package-lock.json: sus "integrity" son hashes en base64 y se parecen a una clave.
 *  - las fuentes: archivos binarios donde cualquier patrón acierta por casualidad.
 */
const EXCLUIR = [':(exclude)*.env.example', ':(exclude)*package-lock.json', ':(exclude)*/fonts/*']

/** Datos personales a buscar. Salen de `frontend/.env`; si no están, no hay con qué comparar. */
function datosPersonales() {
  const web = variablesEnv('frontend/.env')
  const agujas = []

  const tel = (web.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
  if (tel.length >= 9 && !tel.startsWith('51999999999')) {
    agujas.push({ que: 'el número de WhatsApp', texto: tel })
    agujas.push({ que: 'el número de WhatsApp sin prefijo', texto: tel.slice(-9) })
  }

  for (const [clave, que] of [['VITE_INSTAGRAM_URL', 'la cuenta de Instagram'], ['VITE_TIKTOK_URL', 'la cuenta de TikTok']]) {
    const url = web[clave]
    if (!url) continue
    const usuario = url.replace(/\/+$/, '').split('/').pop().replace('@', '').split('?')[0]
    if (usuario && usuario.length > 3 && !/^ejemplo$/i.test(usuario)) agujas.push({ que, texto: usuario })
  }

  const correo = web.VITE_CONTACT_EMAIL
  if (correo && !/ejemplo/i.test(correo)) agujas.push({ que: 'el correo de contacto', texto: correo })

  return agujas
}

/**
 * Busca en los archivos registrados hoy. `literal` usa -F, si no ERE de POSIX.
 *
 * `shell: false` no es un detalle: en Windows, pasar por `cmd` destroza los patrones que llevan
 * comillas o barras verticales, y el comando **no falla**, simplemente deja de encontrar. Así se
 * me escapó la contraseña del panel durante cuatro días.
 */
function enElArbol(texto, literal) {
  return lineasEnElArbol(texto, literal).map((l) => l.split(':')[0])
}

/** Lo mismo, pero devolviendo la línea entera, para poder mirar qué valor se encontró. */
function lineasEnElArbol(texto, literal) {
  const r = ejecutar('git', ['grep', '-I', '-n', '--no-color', literal ? '-F' : '-E', '-i', '-e', texto, '--', '.', ...EXCLUIR], { shell: false })
  if (!r.ok || !r.salida.trim()) return []
  return r.salida.trim().split(/\r?\n/)
}

/** Mira dentro de un commit concreto: ¿alguna de las líneas que casan es una credencial real? */
function hayCredencialDeVerdadEn(commit, regex) {
  const r = ejecutar('git', ['grep', '-I', '-n', '--no-color', '-E', '-i', '-e', regex, commit, '--', '.', ...EXCLUIR], { shell: false })
  if (!r.ok || !r.salida.trim()) return false
  // `git grep <commit>` antepone «commit:» a cada línea; se quita para reusar el mismo filtro.
  return r.salida.trim().split(/\r?\n/)
    .map((l) => l.slice(l.indexOf(':') + 1))
    .some(esDeVerdad)
}

/** Descarta lo que a la vista es un ejemplo y no una credencial de verdad. */
function esDeVerdad(linea) {
  const archivo = linea.split(':')[0]
  if (ARCHIVOS_CON_EJEMPLOS.some((a) => archivo.startsWith(a))) return false
  // Se mira la línea entera, no solo el valor: en `{ username: 'nadie', password: 'equivocada' }`
  // la pista de que es una prueba puede estar en cualquiera de los dos.
  return !PINTA_DE_MENTIRA.test(linea)
}

/**
 * Busca en todo el historial. Se usa el «pickaxe» de git (-S), que recorre los cambios
 * de cada commit sin tener que volcar los diffs. Para texto literal se deja sin
 * --pickaxe-regex, y así no hay que escapar nada.
 */
function enElHistorial(texto, literal) {
  const args = ['log', '--all', '--format=%h %ad', '--date=short', '-S', texto]
  if (!literal) args.push('--pickaxe-regex')
  args.push('--', '.', ...EXCLUIR)
  const r = ejecutar('git', args, { timeout: 300_000, shell: false })
  if (!r.ok || !r.salida.trim()) return []
  return r.salida.trim().split(/\r?\n/)
}

export async function run() {
  const hallazgos = []

  // Contraseñas escritas a mano: se miran línea a línea para poder descartar los ejemplos.
  for (const p of CREDENCIALES_A_MANO) {
    const lineas = lineasEnElArbol(p.regex, false).filter(esDeVerdad)
    if (lineas.length) {
      const archivos = [...new Set(lineas.map((l) => l.split(':')[0]))]
      hallazgos.push({
        gravedad: p.gravedad,
        donde: 'archivos actuales',
        que: `hay ${p.nombre} dentro del código`,
        detalle: archivos.slice(0, 4).join(', '),
      })
    }
    /*
     * En el historial se hace lo mismo en dos pasos: el «pickaxe» de git señala los commits
     * candidatos, y luego se mira **dentro de cada uno** para descartar los ejemplos. Sin este
     * segundo paso el control avisaba de commits que solo traían contraseñas equivocadas puestas
     * a propósito por las propias pruebas, y esos avisos acaban ignorándose.
     */
    const sospechosos = enElHistorial(p.regex, false)
      .filter((linea) => hayCredencialDeVerdadEn(linea.trim().split(' ')[0], p.regex))
    if (sospechosos.length) {
      hallazgos.push({
        gravedad: p.gravedad,
        donde: 'historial',
        que: `${p.nombre} aparece en commits antiguos`,
        detalle: `${sospechosos.length} commit(s): ${sospechosos.slice(0, 3).join(' · ')} — reescribir el historial para quitarla`,
      })
    }
  }

  for (const p of PATRONES) {
    const archivos = [...new Set(enElArbol(p.regex, false))]
    if (archivos.length) {
      hallazgos.push({ gravedad: p.gravedad, donde: 'archivos actuales', que: `hay ${p.nombre} escrito en el repositorio`, detalle: archivos.slice(0, 4).join(', ') })
    }
    const commits = enElHistorial(p.regex, false)
    if (commits.length) {
      hallazgos.push({ gravedad: p.gravedad, donde: 'historial', que: `${p.nombre} apareció en el historial`, detalle: `${commits.length} commit(s): ${commits.slice(0, 3).join(' · ')}` })
    }
  }

  const agujas = datosPersonales()
  if (agujas.length === 0) {
    hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'contactos', que: 'no se pudo comprobar si los contactos están en el repositorio', detalle: 'frontend/.env no tiene los valores reales' })
  }
  for (const a of agujas) {
    const archivos = [...new Set(enElArbol(a.texto, true))]
    if (archivos.length) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'archivos actuales', que: `${a.que} está escrito en el repositorio`, detalle: archivos.slice(0, 4).join(', ') })
    }
    const commits = enElHistorial(a.texto, true)
    if (commits.length) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'historial', que: `${a.que} sigue en el historial`, detalle: `${commits.length} commit(s): ${commits.slice(0, 3).join(' · ')}` })
    }
  }

  for (const archivo of ['frontend/.env', 'backend/.env']) {
    if (leer(archivo) === null) continue
    if (!ejecutar('git', ['check-ignore', archivo]).ok) {
      hallazgos.push({ gravedad: GRAVEDAD.critico, donde: archivo, que: 'no está ignorado por git: cualquier commit lo subiría' })
    }
  }

  const registrados = ejecutar('git', ['ls-files'])
  if (registrados.ok) {
    const malos = registrados.salida.split(/\r?\n/).filter((f) => /(^|\/)\.env$|\.env\.(local|production|bak)/.test(f))
    if (malos.length) {
      hallazgos.push({ gravedad: GRAVEDAD.critico, donde: 'git', que: 'hay archivos de configuración privada registrados', detalle: malos.join(', ') })
    }
  }

  const original = ejecutar('git', ['for-each-ref', '--format=%(refname)', 'refs/original/'])
  if (original.ok && original.salida.trim()) {
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'git', que: 'quedan copias del historial viejo tras reescribirlo', detalle: original.salida.trim().split(/\r?\n/).join(', ') })
  }

  return { titulo: 'Datos privados en el repositorio', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
