import { useEffect } from 'react'

/**
 * Lo que Google lee de cada página, además del título (ese lo pone `usePageTitle`):
 * descripción, dirección canónica, `noindex` y datos schema.org.
 *
 * La web es una sola página de React: `index.html` trae una descripción genérica y aquí se
 * cambia al entrar en cada ruta. Google ejecuta JavaScript y lee lo que queda; WhatsApp y
 * Facebook no, y siguen viendo la de `index.html`.
 */

/** La misma que `index.html`. */
const DESCRIPCION_POR_DEFECTO =
  'Cuadros 3D y boxes temáticos a medida, para regalar o para la oficina. Hechos a mano en Trujillo; cotiza por WhatsApp.'

interface Seo {
  /** Vacío = la de `index.html`. */
  description?: string
  /** true en 404 y fichas que no existen: que Google no las guarde. */
  noindex?: boolean
  /** Datos estructurados schema.org (producto, negocio). */
  jsonLd?: object
}

function enHead<T extends HTMLElement>(selector: string, crear: () => T): T {
  return document.head.querySelector<T>(selector) ?? document.head.appendChild(crear())
}

function metaNombre(nombre: string): HTMLMetaElement {
  return enHead(`meta[name="${nombre}"]`, () => {
    const m = document.createElement('meta')
    m.name = nombre
    return m
  })
}

/** Recorta en el último espacio antes del límite, para no partir palabras. */
export function resumen(texto: string, limite = 155): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (limpio.length <= limite) return limpio
  const corte = limpio.lastIndexOf(' ', limite - 1)
  return `${limpio.slice(0, corte > 0 ? corte : limite - 1)}…`
}

export function useSeo({ description, noindex = false, jsonLd }: Seo = {}): void {
  const datos = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    metaNombre('description').content = description || DESCRIPCION_POR_DEFECTO

    const canonica = enHead('link[rel="canonical"]', () => {
      const l = document.createElement('link')
      l.rel = 'canonical'
      return l
    })
    canonica.href = window.location.origin + window.location.pathname

    const robots = noindex ? metaNombre('robots') : null
    if (robots) robots.content = 'noindex'

    // Un <script type="application/ld+json"> no se ejecuta: es un bloque de datos y la CSP
    // (`script-src 'self'`) no lo toca.
    let bloque: HTMLScriptElement | null = null
    if (datos) {
      bloque = document.createElement('script')
      bloque.type = 'application/ld+json'
      bloque.textContent = datos
      document.head.appendChild(bloque)
    }

    return () => {
      metaNombre('description').content = DESCRIPCION_POR_DEFECTO
      robots?.remove()
      bloque?.remove()
    }
  }, [description, noindex, datos])
}
