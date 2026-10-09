import { pathToFileURL } from 'node:url'
/**
 * Librerías con fallos conocidos, en las dos mitades del proyecto.
 *
 * Web: `npm audit`. Se separa a propósito lo que llega al navegador de lo que solo se usa
 * para desarrollar: un fallo en una herramienta de pruebas no afecta a quien visita la web,
 * y mezclarlo todo lleva a «arreglar» con `npm audit fix --force`, que rompe la suite de QA.
 *
 * Backend: la lista de dependencias de Maven se pregunta a OSV (osv.dev), la base de datos
 * pública de vulnerabilidades que usa Google. No hace falta instalar nada; solo internet.
 * Sin red, el control lo dice en vez de callarse.
 */
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { GRAVEDAD, ejecutar, imprimir, rutaRepo } from './comun.mjs'

const OSV = 'https://api.osv.dev/v1/querybatch'

const PESO = { critical: GRAVEDAD.critico, high: GRAVEDAD.alto, moderate: GRAVEDAD.medio, low: GRAVEDAD.bajo, info: GRAVEDAD.bajo }

/*
 * Avisos sin parche en la rama que usamos y que esta app no puede disparar. Se degradan de ALTO
 * a BAJO: siguen saliendo en el informe, pero no bloquean. Reaparecen solos en cuanto haya un
 * paquete fuera de esta lista. Cada entrada dice por qué no expone y cuándo revisarla.
 * Verificado el 9 oct. 2026 y anotado en .claude/skills/security-audit/TRAMPAS.md (nº 17).
 *   spring-webmvc 6.2.19: GHSA-j9f9-w8pj-32f8 (SSE con fragmentos de vista) y
 *   GHSA-pc63-qcmh-9cmg (XsltView → SSRF/RCE con un mapeo /** que renderiza vistas). Ambos exigen
 *   renderizado de vistas de servidor; esta API es solo @RestController, sin vistas, SSE ni
 *   XsltView (comprobado en los controladores y en `mvnw dependency:tree`: ningún motor de
 *   vistas). Sin parche en la línea 6.2 (solo Spring 7.0.9 / Boot 4). Revisar al subir a Boot 4.
 */
const MOTIVO_SPRING_VISTAS = 'API solo @RestController, sin vistas de servidor/SSE/XsltView; sin parche en 6.2, revisar al subir a Spring Boot 4'
const EXCEPCIONES = {
  'GHSA-j9f9-w8pj-32f8': MOTIVO_SPRING_VISTAS,
  'GHSA-pc63-qcmh-9cmg': MOTIVO_SPRING_VISTAS,
}

function auditarNpm(soloProduccion) {
  const args = ['audit', '--json']
  if (soloProduccion) args.push('--omit=dev')
  // npm audit sale con código 1 cuando encuentra algo: la salida sigue siendo válida. Al fallar,
  // `ejecutar` pega stderr (avisos de npm, el DEP0190 de Node en Windows) a stdout, así que se
  // recorta al objeto JSON —del primer «{» al último «}»— antes de parsear.
  const r = ejecutar('npm', args, { cwd: rutaRepo('frontend') })
  const texto = r.salida ?? ''
  const ini = texto.indexOf('{')
  const fin = texto.lastIndexOf('}')
  if (ini < 0 || fin <= ini) return null
  try {
    return JSON.parse(texto.slice(ini, fin + 1))
  } catch {
    return null
  }
}

function dependenciasDeMaven() {
  // Dentro del proyecto, en `backend/target/` (ignorado por git): nada de archivos
  // sueltos en la carpeta temporal del sistema.
  const carpeta = fileURLToPath(rutaRepo('backend/target/'))
  mkdirSync(carpeta, { recursive: true })
  const destino = join(carpeta, `dependencias-${process.pid}.txt`)
  // En Windows hace falta el `.\` delante: cmd no busca el ejecutable en la carpeta actual.
  const mvnw = process.platform === 'win32' ? String.raw`.\mvnw.cmd` : './mvnw'
  const r = ejecutar(mvnw, ['-q', '-B', 'dependency:list', '-DincludeScope=runtime', `-DoutputFile=${destino}`], {
    cwd: rutaRepo('backend'),
    timeout: 300_000,
  })
  let texto = ''
  try {
    texto = readFileSync(destino, 'utf8')
    rmSync(destino, { force: true })
  } catch {
    return { error: r.error ?? 'no se pudo leer la lista de dependencias' }
  }
  const paquetes = []
  for (const linea of texto.split(/\r?\n/)) {
    // grupo:artefacto:tipo:version:ambito  (a veces con clasificador en medio)
    const trozos = linea.trim().split(':')
    if (trozos.length < 5) continue
    const [grupo, artefacto] = trozos
    const version = trozos[trozos.length - 2]
    if (!/^\d/.test(version)) continue
    paquetes.push({ nombre: `${grupo}:${artefacto}`, version })
  }
  return { paquetes }
}

async function preguntarAOsv(paquetes) {
  const cuerpo = {
    queries: paquetes.map((p) => ({ package: { name: p.nombre, ecosystem: 'Maven' }, version: p.version })),
  }
  const r = await fetch(OSV, { method: 'POST', body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(60_000) })
  if (!r.ok) throw new Error(`OSV respondió ${r.status}`)
  const json = await r.json()
  const afectados = []
  ;(json.results ?? []).forEach((resultado, i) => {
    const vulns = resultado?.vulns ?? []
    if (vulns.length) {
      afectados.push({ ...paquetes[i], avisos: vulns.map((v) => v.id) })
    }
  })
  return afectados
}

export async function run() {
  const hallazgos = []

  // --- Web
  const produccion = auditarNpm(true)
  const todo = auditarNpm(false)

  if (produccion === null) {
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'web', que: 'no se pudo ejecutar npm audit' })
  } else {
    const porGravedad = produccion.metadata?.vulnerabilities ?? {}
    for (const [nivel, cuantos] of Object.entries(porGravedad)) {
      if (nivel === 'total' || !cuantos) continue
      const nombres = Object.entries(produccion.vulnerabilities ?? {})
        .filter(([, v]) => v.severity === nivel)
        .map(([n]) => n)
        .slice(0, 5)
      hallazgos.push({
        gravedad: PESO[nivel] ?? GRAVEDAD.medio,
        donde: 'web (llega al navegador)',
        que: `${cuantos} librería(s) con fallo conocido de nivel ${nivel}`,
        detalle: nombres.join(', '),
      })
    }
  }

  if (todo !== null && produccion !== null) {
    const totalTodo = todo.metadata?.vulnerabilities?.total ?? 0
    const totalProd = produccion.metadata?.vulnerabilities?.total ?? 0
    const soloDesarrollo = totalTodo - totalProd
    if (soloDesarrollo > 0) {
      hallazgos.push({
        gravedad: GRAVEDAD.bajo,
        donde: 'web (solo desarrollo)',
        que: `${soloDesarrollo} aviso(s) en herramientas que no se publican`,
        detalle: 'no afectan a quien visita la web; nunca arreglarlos con npm audit fix --force',
      })
    }
  }

  // --- Backend
  const maven = dependenciasDeMaven()
  if (maven.error) {
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'backend', que: 'no se pudo listar las dependencias de Maven', detalle: maven.error.slice(0, 120) })
  } else {
    try {
      const afectados = await preguntarAOsv(maven.paquetes)
      for (const a of afectados) {
        const sinExcusar = a.avisos.filter((id) => !EXCEPCIONES[id])
        if (sinExcusar.length) {
          hallazgos.push({
            gravedad: GRAVEDAD.alto,
            donde: 'backend',
            que: `${a.nombre} ${a.version} tiene fallos conocidos`,
            detalle: sinExcusar.slice(0, 4).join(', '),
          })
        } else {
          const motivos = [...new Set(a.avisos.map((id) => EXCEPCIONES[id]))].join(' · ')
          hallazgos.push({
            gravedad: GRAVEDAD.bajo,
            donde: 'backend',
            que: `${a.nombre} ${a.version}: ${a.avisos.join(', ')} — excepción documentada`,
            detalle: motivos,
          })
        }
      }
      if (afectados.length === 0) {
        hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'backend', que: `${maven.paquetes.length} librerías revisadas contra osv.dev, ninguna con fallos conocidos`, detalle: 'informativo' })
      }
    } catch (e) {
      hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'backend', que: 'no se pudo consultar osv.dev (¿sin internet?)', detalle: String(e.message ?? e).slice(0, 100) })
    }
  }

  return { titulo: 'Librerías con fallos conocidos', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
