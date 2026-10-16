/**
 * La copia reducida de cada foto (`<uuid>.min.jpg`, 1200 px), que el backend guarda al subirla
 * junto a la original. Se usa en las tarjetas y el carrusel, donde la foto se ve a unos cientos
 * de píxeles; la ficha y la ampliación siguen usando la original.
 *
 * Solo tienen copia las fotos subidas al almacén (Supabase) en JPG o PNG desde que existe esta
 * función. Las de antes, las WebP y las de muestra no: si la copia no carga, la tarjeta vuelve a
 * la original (`useFotoReducida`) y esa foto queda apuntada para no volver a pedirla.
 *
 * El mismo cálculo está repetido en `api/obra.ts` (la tarjeta al compartir una obra).
 */

const ORIGINAL_EN_ALMACEN = /\/storage\/v1\/object\/public\/[^/]+\/[0-9a-f-]{36}\.(jpe?g|png)$/i

/** Fotos cuya copia ya se sabe que no existe, para no pedirla otra vez al volver a la página. */
const sinCopia = new Set<string>()

export function fotoReducida(url: string): string {
  if (sinCopia.has(url) || !ORIGINAL_EN_ALMACEN.test(url)) return url
  return url.replace(/\.(jpe?g|png)$/i, '.min.jpg')
}

export function marcarSinCopia(url: string): void {
  sinCopia.add(url)
}
