/**
 * Lanza toda la suite y deja un único informe en lenguaje llano.
 * Sale con código distinto de cero si queda algo CRÍTICO o ALTO, para poder
 * engancharlo a un hook o a CI más adelante.
 *
 * Uso:  npm run qa            (con el frontend en :5173 y el backend en :8080)
 *       npm run qa -- rapido  (se salta Lighthouse, que es el lento)
 */
import { BASE, GRAVEDAD, imprimir, ordenar } from './shared.mjs'

const rapido = process.argv.includes('rapido')

const CONTROLES = [
  ['./content.mjs', 'textos'],
  ['./links.mjs', 'enlaces'],
  ['./contrast.mjs', 'contraste'],
  ['./a11y.mjs', 'accesibilidad'],
  ['./responsive.mjs', 'pantallas'],
  ...(rapido ? [] : [['./lighthouse.mjs', 'lighthouse']]),
]

// El servidor tiene que estar en marcha: si no, todo falla por el mismo motivo y confunde.
try {
  const r = await fetch(BASE, { signal: AbortSignal.timeout(5000) })
  if (!r.ok) throw new Error(String(r.status))
} catch {
  console.error(`\nNo hay nada respondiendo en ${BASE}.`)
  console.error('Arranca la web con `npm run dev` (y el backend con backend\\run-dev.ps1) y repite.\n')
  process.exit(2)
}

const todos = []
for (const [archivo, nombre] of CONTROLES) {
  process.stdout.write(`\n· comprobando ${nombre}…`)
  try {
    const { run } = await import(archivo)
    const r = await run()
    process.stdout.write(` ${r.hallazgos.length} hallazgo(s)`)
    imprimir(r.titulo, r.hallazgos)
    todos.push(...r.hallazgos.map((h) => ({ ...h, control: nombre })))
  } catch (e) {
    process.stdout.write(' ERROR')
    todos.push({ gravedad: GRAVEDAD.critico, donde: nombre, que: 'la comprobación se rompió', detalle: String(e).slice(0, 160), control: nombre })
  }
}

const cuenta = (g) => todos.filter((h) => h.gravedad === g).length
console.log('\n' + '─'.repeat(70))
console.log(`RESUMEN   críticos: ${cuenta(GRAVEDAD.critico)}   altos: ${cuenta(GRAVEDAD.alto)}   medios: ${cuenta(GRAVEDAD.medio)}   bajos: ${cuenta(GRAVEDAD.bajo)}`)

const graves = ordenar(todos.filter((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto))
if (graves.length) {
  console.log('\nHay que arreglar esto antes de publicar:')
  for (const h of graves) console.log(`  · [${h.control}] ${h.donde}: ${h.que}`)
} else {
  console.log('\nNada grave. La web está lista para publicar.')
}
console.log('─'.repeat(70) + '\n')

process.exit(graves.length ? 1 : 0)
