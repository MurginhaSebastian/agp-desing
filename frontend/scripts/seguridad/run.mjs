/**
 * Auditoría de seguridad completa, en un solo informe y en lenguaje llano.
 * Sale con código distinto de cero si queda algo CRÍTICO o ALTO.
 *
 * Uso:  npm run seg            (con el frontend en :5173 y el backend en :8080)
 *       npm run seg:rapido     (se salta los dos controles lentos: librerías y CSP)
 *
 * El orden no es casual:
 *   · lo que no necesita servidores va primero, para que algo se mida siempre;
 *   · «permisos» necesita poder entrar como administrador;
 *   · «freno del login» va al final porque deja el login bloqueado un minuto.
 */
import { API, BASE, GRAVEDAD, estaEnMarcha, imprimir, ordenar } from './comun.mjs'

const rapido = process.argv.includes('rapido')

const CONTROLES = [
  { archivo: './secretos.mjs', nombre: 'datos privados', necesita: [] },
  ...(rapido ? [] : [{ archivo: './dependencias.mjs', nombre: 'librerías', necesita: [] }]),
  { archivo: './cabeceras.mjs', nombre: 'cabeceras', necesita: ['api'] },
  // Compila la web y la sirve con sus cabeceras: es lento, pero es lo único que prueba
  // que la CSP no deja la página en blanco. No necesita los servidores de desarrollo.
  ...(rapido ? [] : [{ archivo: './csp.mjs', nombre: 'la web con las cabeceras puestas', necesita: [] }]),
  { archivo: './supabase.mjs', nombre: 'base de datos desde fuera', necesita: [] },
  { archivo: './fotos.mjs', nombre: 'fotos del catálogo', necesita: ['api'] },
  { archivo: './autorizacion.mjs', nombre: 'permisos', necesita: ['api'] },
  { archivo: './limite-login.mjs', nombre: 'freno del login', necesita: ['api'] },
]

const apiArriba = await estaEnMarcha(`${API}/api/products`)
const webArriba = await estaEnMarcha(BASE)

console.log(`\nweb (${BASE}): ${webArriba ? 'en marcha' : 'apagada'}   ·   API (${API}): ${apiArriba ? 'en marcha' : 'apagada'}`)
if (!apiArriba) {
  console.log('Sin el backend, los controles de permisos y del login no se pueden medir.')
  console.log('Arráncalo con backend\\run-dev.ps1 y repite para que la auditoría esté completa.')
}

const todos = []
const saltados = []

for (const c of CONTROLES) {
  if (c.necesita.includes('api') && !apiArriba) {
    saltados.push(c.nombre)
    continue
  }
  process.stdout.write(`\n· revisando ${c.nombre}…`)
  try {
    const { run } = await import(c.archivo)
    const r = await run()
    process.stdout.write(` ${r.hallazgos.length} hallazgo(s)`)
    imprimir(r.titulo, r.hallazgos)
    if (r.nota) console.log(`  (${r.nota})`)
    todos.push(...r.hallazgos.map((h) => ({ ...h, control: c.nombre })))
  } catch (e) {
    process.stdout.write(' ERROR')
    todos.push({ gravedad: GRAVEDAD.critico, donde: c.nombre, que: 'la comprobación se rompió', detalle: String(e).slice(0, 160), control: c.nombre })
  }
}

const cuenta = (g) => todos.filter((h) => h.gravedad === g).length
console.log('\n' + '─'.repeat(72))
console.log(`RESUMEN   críticos: ${cuenta(GRAVEDAD.critico)}   altos: ${cuenta(GRAVEDAD.alto)}   medios: ${cuenta(GRAVEDAD.medio)}   bajos: ${cuenta(GRAVEDAD.bajo)}`)
if (saltados.length) console.log(`No se pudo medir (hace falta el backend): ${saltados.join(', ')}`)

const graves = ordenar(todos.filter((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto))
if (graves.length) {
  console.log('\nHay que arreglar esto antes de publicar:')
  for (const h of graves) console.log(`  · [${h.control}] ${h.donde}: ${h.que}`)
} else {
  console.log('\nNada grave. Recuerda que esto revisa lo que se puede medir desde aquí:')
  console.log('lo que pase en las cuentas (Supabase, Vercel, GitHub) se revisa a mano.')
}
console.log('─'.repeat(72) + '\n')

process.exit(graves.length ? 1 : 0)
