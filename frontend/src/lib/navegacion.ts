import type { Product } from '@/types/product'

/*
 * Lo que unas páginas le pasan a otras al navegar (`state` de React Router). Antes cada sitio lo
 * leía con un `as` distinto y nada comprobaba que quien lo manda y quien lo lee hablaran de lo
 * mismo. Aquí está cada contrato una vez, con su función para crearlo y la de leerlo.
 */

/** Catálogo → ficha: la obra entera, para que la ficha se pinte con la foto desde el primer instante. */
interface EstadoFicha {
  product: Product
}

/** Ficha → catálogo: de qué obra se viene (su foto vuelve a su tarjeta) y que es una vuelta. */
interface EstadoVolver {
  desde: string
  volver: true
}

/** Panel protegido → login: a qué página volver después de entrar. */
interface EstadoLogin {
  from: string
}

export const haciaFicha = (product: Product): EstadoFicha => ({ product })
export const volviendoDe = (slug: string): EstadoVolver => ({ desde: slug, volver: true })
export const paraVolverA = (ruta: string): EstadoLogin => ({ from: ruta })

function campo(state: unknown, nombre: string): unknown {
  return typeof state === 'object' && state !== null ? (state as Record<string, unknown>)[nombre] : undefined
}

/** La obra que trajo la tarjeta, si la hay. */
export function obraTraida(state: unknown): Product | undefined {
  const p = campo(state, 'product')
  return typeof p === 'object' && p !== null ? (p as Product) : undefined
}

/** El slug de la ficha de la que se vuelve, si se vuelve de una. */
export function fichaDeOrigen(state: unknown): string | undefined {
  const s = campo(state, 'desde')
  return typeof s === 'string' ? s : undefined
}

/** Si se llegó con el enlace de volver (cuenta igual que el botón «atrás»). */
export function esVuelta(state: unknown): boolean {
  return campo(state, 'volver') === true
}

/** Adónde ir después de entrar al panel. */
export function rutaDeVuelta(state: unknown, porDefecto: string): string {
  const r = campo(state, 'from')
  return typeof r === 'string' ? r : porDefecto
}
