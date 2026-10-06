import { useEffect, useRef, useState } from 'react'

type EstadoRecurso = 'loading' | 'ok' | 'missing'

/**
 * Pide UNA cosa al servidor (una obra por su slug, una obra por su id…) y dice en qué punto está.
 *
 * - `clave` identifica qué se pide: al cambiar, se vuelve a pedir. Con `null` no se pide nada y
 *   el estado es `ok` (la página de «nuevo cuadro», por ejemplo, no tiene nada que cargar).
 * - `inicial` es lo que ya se tiene antes de preguntar (la obra que trajo la tarjeta). Se enseña
 *   enseguida y se refresca por detrás; si el refresco falla, se sigue enseñando: un fallo de
 *   red no convierte en «no existe» algo que se está viendo.
 * - Si la página se cierra o la clave cambia antes de que llegue la respuesta, esa respuesta se
 *   descarta.
 */
export function useRecurso<T>(clave: string | null, cargar: (clave: string) => Promise<T>, inicial: T | null = null) {
  const [dato, setDato] = useState<T | null>(inicial)
  const [estado, setEstado] = useState<EstadoRecurso>(clave === null || inicial ? 'ok' : 'loading')
  // La función cambia en cada render; lo que decide cuándo volver a pedir es la clave.
  const cargarRef = useRef(cargar)
  useEffect(() => {
    cargarRef.current = cargar
  })

  useEffect(() => {
    if (clave === null) return
    let vivo = true
    if (!inicial) setEstado('loading')
    cargarRef
      .current(clave)
      .then((d) => {
        if (!vivo) return
        setDato(d)
        setEstado('ok')
      })
      .catch(() => vivo && !inicial && setEstado('missing'))
    return () => {
      vivo = false
    }
  }, [clave, inicial])

  return { dato, estado }
}
