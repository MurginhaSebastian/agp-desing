import { useEffect } from 'react'

/** El título de la pestaña en la portada y en todo lo que no pone uno propio (igual que `index.html`). */
const TITULO_POR_DEFECTO = 'AGP Desing - Regalos y decoración corporativa'

/**
 * Pone el título de la pestaña mientras la página está abierta y deja el de siempre al salir.
 * Con `null` no toca nada (por ejemplo, mientras aún no se sabe el nombre de la obra).
 */
export function usePageTitle(titulo: string | null) {
  useEffect(() => {
    if (titulo === null) return
    document.title = titulo
    return () => {
      document.title = TITULO_POR_DEFECTO
    }
  }, [titulo])
}
