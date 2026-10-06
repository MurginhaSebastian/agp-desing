import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { esVuelta } from '@/lib/navegacion'

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
/** Dónde se quedó cada página la última vez que se salió de ella. */
const posiciones = new Map<string, number>()

export function ScrollManager() {
  const { pathname, hash, key, state } = useLocation()
  const tipo = useNavigationType()
  const anterior = useRef<string | null>(null)

  /*
   * Dentro de la web manda este componente, no el navegador. Con el modo `auto`, al pulsar
   * «atrás» el navegador aplicaba además su propia posición guardada, unos milisegundos después
   * y unos píxeles distinta: la obra de la que se venía aparecía 5–9 px más arriba.
   */
  useEffect(() => {
    if (!('scrollRestoration' in history)) return
    history.scrollRestoration = 'manual'
    return () => {
      history.scrollRestoration = 'auto'
    }
  }, [])

  /*
   * Efecto de maquetación y no normal: tiene que colocar la página ANTES de que el navegador
   * la dibuje. Si no, en la transición catálogo ↔ ficha el navegador fotografiaría la página
   * en la posición equivocada y la foto viajaría a un sitio que ya no está en pantalla.
   */
  useLayoutEffect(() => {
    // Todavía no se ha movido nada: lo que marca el scroll es la página de la que se sale.
    if (anterior.current !== null) posiciones.set(anterior.current, window.scrollY)
    anterior.current = pathname

    if (!hash) {
      /*
       * Volver (el botón «atrás» del navegador, o el enlace «Catálogo» de la ficha) deja la
       * página donde estaba, como en cualquier web. Ir a una página nueva empieza arriba.
       * Siempre `instant`: con `auto` manda el `scroll-behavior: smooth` del CSS y cada cambio
       * de página se veía subir entero.
       */
      const vuelve = tipo === 'POP' || esVuelta(state)
      window.scrollTo({ top: vuelve ? (posiciones.get(pathname) ?? 0) : 0, behavior: 'instant' })
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
  }, [pathname, hash, key, tipo, state])

  return null
}
