import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Al cambiar de ruta: si hay hash, desplaza a esa sección (con offset del
 * header pegajoso); si no, vuelve arriba. React Router no lo hace solo.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    const id = hash.slice(1)
    // Esperar al render de la página destino
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
      el.setAttribute('tabindex', '-1')
      el.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
