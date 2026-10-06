import { pathToFileURL } from 'node:url'
/**
 * Código y archivos que ya no se usan.
 *
 * Solo informa: **nunca borra**. En este proyecto hay cosas que parecen huérfanas y no lo son,
 * y hay que mirarlas una por una:
 *   · `robots.txt` y el favicon los pide el navegador por su cuenta, no los importa ningún .tsx;
 *   · las fotos del catálogo **viven en la base de datos**, así que un archivo de
 *     `public/images/obras/` puede estar en uso sin aparecer en el código;
 *   · `mock-products.ts` existe a propósito para el modo demo, aunque en producción no se use;
 *   · `typescript`, `@types/*` y los plugins de Vite no se «importan» en ningún sitio y hacen
 *     falta igual.
 *
 * Por eso cada apartado lleva su lista blanca comentada, y el control se comprueba a sí mismo
 * antes de dar resultados (ver `autocomprobacion`).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { API, GRAVEDAD, imprimir } from './shared.mjs'

const RAIZ = new URL('../../', import.meta.url).pathname.replace(/^\//, '').replace(/\/$/, '')
const SRC = join(RAIZ, 'src')

/** Carpetas que no se recorren nunca. */
const IGNORAR_DIRS = new Set(['node_modules', 'dist', 'dist-seg', '.git', 'fonts'])

/* Archivos que el navegador pide por su cuenta o que arrancan la aplicación: no los importa nadie. */
const SIEMPRE_EN_USO = new Set([
  'public/robots.txt',
  'public/favicon.svg',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/fonts.css',
])

/*
 * Se detectaron sin uso y el dueño decidió conservarlas. No se reportan como hallazgo, pero
 * salen en la nota final para que la decisión siga a la vista y se pueda revisar.
 */
const CONSERVADAS_A_PROPOSITO = new Map([
  ['pa11y', 'no lo usa ningún script (la accesibilidad la mide axe), pero se guarda como segunda opinión'],
])

/* Dependencias que no aparecen en el código por diseño. */
const DEPENDENCIAS_NECESARIAS = new Set([
  'typescript', // lo usa `tsc -b` en el build
  'vite', // lo usan los scripts de npm
  'oxlint', // idem
  '@types/node', '@types/react', '@types/react-dom', // tipos, los usa tsc
  '@vitejs/plugin-react', '@tailwindcss/vite', // van en vite.config.ts por su nombre de import
  'tailwindcss', // lo carga el plugin
])

function listar(dir, acumulado = []) {
  if (!existsSync(dir)) return acumulado
  for (const entrada of readdirSync(dir)) {
    if (IGNORAR_DIRS.has(entrada)) continue
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) listar(ruta, acumulado)
    else acumulado.push(relative(RAIZ, ruta).split('\\').join('/'))
  }
  return acumulado
}

function leer(rutaRelativa) {
  try {
    return readFileSync(join(RAIZ, rutaRelativa), 'utf8')
  } catch {
    return ''
  }
}

/** Todo el texto donde algo puede estar referenciado, una sola vez y en memoria. */
function corpus() {
  const archivos = [
    ...listar(SRC),
    ...listar(join(RAIZ, 'scripts')),
    'index.html',
    'vite.config.ts',
    'package.json',
    '.oxlintrc.json',
    'vercel.json',
  ].filter((f) => /\.(ts|tsx|mjs|js|css|html|json)$/.test(f))

  const textos = new Map()
  for (const f of archivos) textos.set(f, leer(f))
  return textos
}

/** Direcciones de imagen que tiene guardadas la base de datos. Sin backend, se avisa. */
async function fotosDelCatalogo() {
  try {
    const r = await fetch(`${API}/api/products`, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) return null
    return (await r.json()).map((p) => String(p.imageUrl ?? ''))
  } catch {
    return null
  }
}

function seMencionaEn(textos, aguja, exceptoArchivo) {
  for (const [archivo, texto] of textos) {
    if (archivo === exceptoArchivo) continue
    if (texto.includes(aguja)) return true
  }
  return false
}

export async function run() {
  const hallazgos = []
  const textos = corpus()
  /*
   * Cuántas cosas se miraron en cada apartado. Va en el informe a propósito: un apartado que
   * dice «nada» habiendo mirado 0 archivos no está limpio, está roto (pasó con el control de
   * dependencias del backend, que no encontraba `mvnw` y se quedaba callado).
   */
  const revisados = { archivos: 0, exports: 0, imagenes: 0, dependencias: 0, clases: 0, metodosJava: 0 }

  /*
   * AUTOCOMPROBACIÓN. Si el detector no encuentra las referencias a un archivo que se usa con
   * toda seguridad, está midiendo mal y todo lo demás sobra. Mejor decirlo que dar una lista
   * de borrados falsos.
   */
  const control = 'src/pages/public/HomePage.tsx'
  if (existsSync(join(RAIZ, control)) && !seMencionaEn(textos, 'HomePage', control)) {
    return {
      titulo: 'Código sin usar',
      hallazgos: [{ gravedad: GRAVEDAD.critico, donde: 'el control', que: 'no encuentra referencias a una página que sí se usa: la medición no vale', detalle: control }],
    }
  }

  // 1. Archivos de src/ que nadie importa
  for (const archivo of listar(SRC)) {
    if (SIEMPRE_EN_USO.has(archivo)) continue
    if (!/\.(ts|tsx)$/.test(archivo)) continue
    // Las pruebas no las importa nadie: Vitest las encuentra por el nombre (`*.test.ts[x]`).
    if (/\.test\.tsx?$/.test(archivo)) continue
    revisados.archivos++
    const base = archivo.split('/').pop().replace(/\.tsx?$/, '')
    const sinExtension = archivo.replace(/\.tsx?$/, '').replace(/^src\//, '')
    if (!seMencionaEn(textos, sinExtension, archivo) && !seMencionaEn(textos, `/${base}'`, archivo) && !seMencionaEn(textos, `/${base}"`, archivo)) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: archivo, que: 'ningún archivo lo importa' })
    }
  }

  // 2. Exports que no se usan fuera de su propio archivo
  for (const [archivo, texto] of textos) {
    if (!/^src\/.*\.(ts|tsx)$/.test(archivo)) continue
    for (const m of texto.matchAll(/^export (?:const|function|class|interface|type) ([A-Za-z_$][\w$]*)/gm)) {
      const nombre = m[1]
      revisados.exports++
      if (!seMencionaEn(textos, nombre, archivo)) {
        hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: archivo, que: `«${nombre}» se exporta y nadie lo usa fuera de este archivo` })
      }
    }
  }

  // 3. Imágenes y archivos de public/ y src/assets sin referencia
  const fotos = await fotosDelCatalogo()
  if (fotos === null) {
    hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'catálogo', que: 'sin backend no se pudo comprobar qué fotos usa la base de datos', detalle: 'los archivos de public/images se revisan solo contra el código' })
  }
  for (const archivo of [...listar(join(RAIZ, 'public')), ...listar(join(RAIZ, 'src', 'assets'))]) {
    if (SIEMPRE_EN_USO.has(archivo)) continue
    revisados.imagenes++
    const nombre = archivo.split('/').pop()
    if (seMencionaEn(textos, nombre, null)) continue
    if (fotos && fotos.some((u) => u.includes(nombre))) continue
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: archivo, que: 'no lo usa ni el código ni el catálogo' })
  }

  // 4. Dependencias declaradas que no se usan
  const paquete = JSON.parse(leer('package.json') || '{}')
  const scripts = Object.values(paquete.scripts ?? {}).join(' ')
  for (const dep of [...Object.keys(paquete.dependencies ?? {}), ...Object.keys(paquete.devDependencies ?? {})]) {
    if (DEPENDENCIAS_NECESARIAS.has(dep) || CONSERVADAS_A_PROPOSITO.has(dep)) continue
    revisados.dependencias++
    const enCodigo = [...textos].some(([archivo, texto]) => archivo !== 'package.json' && texto.includes(dep))
    if (!enCodigo && !scripts.includes(dep)) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'package.json', que: `la dependencia «${dep}» no se usa en ningún sitio`, detalle: 'cada dependencia de más es código ajeno que hay que vigilar' })
    }
  }

  /*
   * 5. Clases y utilidades de index.css sin usar.
   * Se buscan también las reglas sangradas (las de `@layer components` y las de dentro de un
   * `@media`): antes solo se leían las que empezaban en la columna 0 y ninguna de esas se
   * revisaba nunca. Y se busca la clase como palabra entera: por subcadena, «rule» contaba como
   * usada porque existe «rule-dark». Una utilidad que solo se usa con `@apply` dentro del CSS
   * (como `btn` en `.btn-primary`) cuenta como usada.
   */
  const css = leer('src/index.css')
  const declaradas = new Set()
  for (const m of css.matchAll(/@utility\s+([a-z][\w-]*)/g)) declaradas.add(m[1].replace(/-\*$/, ''))
  for (const m of css.matchAll(/^\s*\.([a-z][\w-]*)/gm)) declaradas.add(m[1])
  const aplicadas = [...css.matchAll(/@apply\s+([^;]+);/g)].map((m) => ` ${m[1]} `).join('')
  for (const clase of declaradas) {
    revisados.clases++
    const palabra = new RegExp(String.raw`(^|[^\w-])${clase}([^\w-]|$)`, 'm')
    const usada = palabra.test(aplicadas)
      || [...textos].some(([archivo, texto]) => /\.(tsx|ts|html)$/.test(archivo) && palabra.test(texto))
    if (!usada) hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'src/index.css', que: `«${clase}» está definida y no se usa` })
  }

  // 6. Restos: copias, compilaciones de prueba
  for (const archivo of listar(RAIZ).filter((f) => /\.(bak|orig|rej)$|~$/.test(f))) {
    hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: archivo, que: 'parece una copia de trabajo olvidada' })
  }
  if (existsSync(join(RAIZ, 'dist-seg'))) {
    hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: 'dist-seg/', que: 'compilación de prueba de seg:csp, se puede borrar', detalle: 'no se sube: está en .gitignore' })
  }

  // 7. Backend: métodos públicos que nadie llama
  const backend = join(RAIZ, '..', 'backend', 'src')
  if (existsSync(backend)) {
    const javas = listar(backend).filter((f) => f.endsWith('.java'))
    const todoJava = new Map(javas.map((f) => [f, leer(f)]))
    for (const [archivo, texto] of todoJava) {
      if (!/\/(usecase|repository)\//.test(archivo)) continue
      for (const m of texto.matchAll(/public\s+[\w<>,\s[\]]+\s+(\w+)\s*\(/g)) {
        const nombre = m[1]
        if (['execute', 'toString', 'equals', 'hashCode'].includes(nombre)) continue
        revisados.metodosJava++
        const usos = [...todoJava].filter(([otro, t]) => otro !== archivo && t.includes(`${nombre}(`)).length
        if (usos === 0) {
          hallazgos.push({ gravedad: GRAVEDAD.bajo, donde: archivo.split('/').pop(), que: `«${nombre}()» es público y nadie lo llama` })
        }
      }
    }
  }

  const nota = `revisados: ${revisados.archivos} archivos, ${revisados.exports} exports, `
    + `${revisados.imagenes} imágenes, ${revisados.dependencias} dependencias, ${revisados.clases} clases, `
    + `${revisados.metodosJava} métodos del backend — solo informa, borrar es decisión del dueño`
    + (CONSERVADAS_A_PROPOSITO.size ? `\n  se conservan a propósito: ${[...CONSERVADAS_A_PROPOSITO].map(([n, p]) => `${n} (${p})`).join('; ')}` : '')
  for (const [apartado, cuantos] of Object.entries(revisados)) {
    if (cuantos === 0) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'el control', que: `el apartado «${apartado}» no revisó nada, así que su «sin hallazgos» no vale` })
    }
  }
  return { titulo: 'Código sin usar', hallazgos, nota }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  if (r.nota) console.log(`  (${r.nota})`)
  // Código muerto no rompe nada: nunca hace fallar la suite.
  process.exit(0)
}
