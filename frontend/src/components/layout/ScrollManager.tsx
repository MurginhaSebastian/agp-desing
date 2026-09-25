import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Alto de la cabecera pegajosa: hay que descontarlo para no tapar el título. */
const HEADER = 80
/** Cuánto se sigue corrigiendo la posición después del salto inicial. */
const CORRECCION_MS = 2500

/**
 * Al cambiar de ruta: si hay hash, desplaza a esa sección; si no, vuelve arriba.
 * React Router no lo hace solo.
 *
 * Al venir de otra página la sección se mueve DESPUÉS del primer dibujado: las obras del
 * catálogo llegan del servidor y empujan el resto más de mil píxeles hacia abajo. Por eso
 * no basta con medir una vez: se salta enseguida y se sigue corrigiendo un par de segundos
 * mientras el contenido termina de colocarse.
 */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    const id = hash.slice(1)
    let frame = 0
    let objetivo = -1
    let primero = true
    const inicio = performance.now()

    const seguir = () => {
      const el = document.getElementById(id)
      if (el) {
        const top = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - HEADER))
        if (Math.abs(top - objetivo) > 2) {
          objetivo = top
          // El primer salto se ve; las correcciones posteriores son secas para no encadenar animaciones.
          window.scrollTo({ top, behavior: primero ? 'smooth' : 'instant' })
          if (primero) {
            el.setAttribute('tabindex', '-1')
            el.focus({ preventScroll: true })
            primero = false
          }
        }
      }
      if (performance.now() - inicio < CORRECCION_MS) frame = requestAnimationFrame(seguir)
    }

    frame = requestAnimationFrame(seguir)
    return () => cancelAnimationFrame(frame)
    // `key` cambia en cada navegación: sin él, pulsar dos veces el mismo enlace no hacía nada.
  }, [pathname, hash, key])

  return null
}
