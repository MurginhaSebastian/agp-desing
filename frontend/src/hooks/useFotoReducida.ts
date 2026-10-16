import { useState } from 'react'
import { fotoReducida, marcarSinCopia } from '@/lib/fotos'

/**
 * La dirección que hay que pintar para una foto del catálogo: su copia reducida si la hay.
 * `alFallar` va en el `onError` del <img>: si la copia no existe (foto subida antes de que
 * hubiera copias), apunta la foto y vuelve a pintar con la original.
 */
export function useFotoReducida(url: string) {
  const [, repintar] = useState(0)
  const src = fotoReducida(url)
  const alFallar = () => {
    if (src === url) return
    marcarSinCopia(url)
    repintar((n) => n + 1)
  }
  return { src, alFallar }
}
