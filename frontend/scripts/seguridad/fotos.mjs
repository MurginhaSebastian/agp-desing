import { pathToFileURL } from 'node:url'
/**
 * De dónde salen las fotos del catálogo y si se ven enteras.
 *
 * Esto está en la auditoría de seguridad y no en la de calidad por un motivo concreto: una foto
 * alojada en otro servidor hace que **cada visitante le entregue su dirección IP a ese tercero**
 * sin enterarse. Además deja el catálogo a merced de que ese servicio borre el archivo (ya pasó:
 * una tarjeta salió vacía).
 *
 * Desde que el panel sube las fotos, su sitio es **Supabase Storage**, que es el mismo proveedor
 * que ya guarda la base de datos y está declarado en la política de privacidad. Ese servidor no
 * se cuenta como tercero ajeno; cualquier otro, sí. También valen las fotos propias en
 * `frontend/public/images/obras/`, referenciadas con una ruta que empieza por `/`.
 *
 * Lo demás que mide —que carguen y que no se recorten— es la regla del proyecto: las fotos no se
 * recortan nunca. El catálogo se edita a mano, así que nadie más va a darse cuenta.
 *
 * Solo lee: pide el catálogo a la API y abre las páginas en un navegador.
 */
import { API, BASE, GRAVEDAD, abrirNavegador, imprimir, pedir, supabase } from './comun.mjs'

/** Cuánto puede desviarse la caja de la proporción de la foto antes de llamarlo recorte. */
const RECORTE_TOLERADO = 3

export async function run() {
  const hallazgos = []

  const respuesta = await pedir(`${API}/api/products`)
  if (respuesta.error || respuesta.estado !== 200) {
    return {
      titulo: 'Fotos del catálogo',
      hallazgos: [{ gravedad: GRAVEDAD.bajo, donde: 'catálogo', que: 'no se pudo leer el catálogo', detalle: respuesta.error ?? `HTTP ${respuesta.estado}` }],
    }
  }
  let productos
  try {
    productos = JSON.parse(respuesta.cuerpo)
  } catch {
    return { titulo: 'Fotos del catálogo', hallazgos: [{ gravedad: GRAVEDAD.bajo, donde: 'catálogo', que: 'la respuesta del catálogo no se entiende' }] }
  }

  // 1. ¿Está la foto en casa? ¿Y sigue ahí?
  // «Casa» es el almacén propio de Supabase, el declarado en la política de privacidad.
  const cfg = supabase()
  const propio = cfg.url ? new URL(cfg.url).host : null
  const ajenos = new Set()
  for (const p of productos) {
    const nombre = p.name.slice(0, 30)
    const url = String(p.imageUrl ?? '')

    if (/^https?:\/\//i.test(url)) {
      const host = new URL(url).host
      if (host !== propio) ajenos.add(host)
      const foto = await pedir(url, { timeoutMs: 20_000 })
      if (foto.error || foto.estado >= 400) {
        hallazgos.push({
          gravedad: GRAVEDAD.alto,
          donde: nombre,
          que: 'la foto ya no está donde apunta el enlace, la tarjeta sale vacía',
          detalle: foto.error ?? `HTTP ${foto.estado}`,
        })
      }
    } else if (!url.startsWith('/')) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: nombre, que: 'la dirección de la foto no es válida', detalle: url.slice(0, 60) })
    }
  }

  if (ajenos.size > 0) {
    hallazgos.push({
      gravedad: GRAVEDAD.medio,
      donde: 'privacidad',
      que: 'hay fotos alojadas en un servidor ajeno, así que cada visitante le entrega su IP',
      detalle: `${[...ajenos].join(', ')} — súbelas desde el panel y quedarán en el almacén propio`,
    })
  }

  // 2. ¿Se ven, y se ven enteras?
  const navegador = await abrirNavegador()
  try {
    const page = await navegador.newPage({ viewport: { width: 1440, height: 900 } })

    await page.goto(BASE + '/catalogo', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const tarjetas = await page.$$eval('a[href^="/catalogo/"] img', (imgs) =>
      imgs.map((img) => {
        const caja = img.getBoundingClientRect()
        return {
          alt: (img.alt || '(sin descripción)').slice(0, 30),
          cargada: img.naturalWidth > 0,
          proporcionFoto: img.naturalWidth > 0 ? img.naturalWidth / img.naturalHeight : 0,
          proporcionCaja: caja.height > 0 ? caja.width / caja.height : 0,
        }
      }),
    )

    if (tarjetas.length === 0) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'catálogo', que: 'no se encontró ninguna tarjeta con foto, así que no se pudo medir nada' })
    }

    for (const t of tarjetas) {
      if (!t.cargada) {
        hallazgos.push({ gravedad: GRAVEDAD.alto, donde: t.alt, que: 'la tarjeta se queda sin foto' })
        continue
      }
      const desvio = Math.round(Math.abs(1 - t.proporcionCaja / t.proporcionFoto) * 100)
      if (desvio > RECORTE_TOLERADO) {
        hallazgos.push({ gravedad: GRAVEDAD.medio, donde: t.alt, que: 'la tarjeta recorta la foto', detalle: `se pierde cerca del ${desvio} % de un lado` })
      }
    }

    // La ficha de cada cuadro: la foto entera, con object-contain
    const rutas = await page.$$eval('a[href^="/catalogo/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))])
    for (const ruta of rutas) {
      await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
      await page.waitForTimeout(700)
      const fichas = await page.$$eval('figure img', (imgs) =>
        imgs.map((img) => {
          const c = img.getBoundingClientRect()
          return {
            cargada: img.naturalWidth > 0,
            proporcionFoto: img.naturalWidth > 0 ? img.naturalWidth / img.naturalHeight : 0,
            proporcionMostrada: c.height > 0 ? c.width / c.height : 0,
            ajuste: getComputedStyle(img).objectFit,
          }
        }),
      )
      for (const f of fichas) {
        if (!f.cargada) {
          hallazgos.push({ gravedad: GRAVEDAD.alto, donde: `ficha ${ruta}`, que: 'la ficha se queda sin foto' })
          continue
        }
        const desvio = Math.round(Math.abs(1 - f.proporcionMostrada / f.proporcionFoto) * 100)
        if (f.ajuste !== 'contain' && desvio > RECORTE_TOLERADO) {
          hallazgos.push({ gravedad: GRAVEDAD.alto, donde: `ficha ${ruta}`, que: 'la ficha recorta la foto', detalle: `se pierde cerca del ${desvio} %, con object-fit ${f.ajuste}` })
        }
      }
    }

    return { titulo: 'Fotos del catálogo', hallazgos, nota: `${productos.length} cuadros y ${rutas.length} fichas revisadas` }
  } finally {
    await navegador.close().catch(() => {})
  }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  if (r.nota) console.log(`  (${r.nota})`)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
