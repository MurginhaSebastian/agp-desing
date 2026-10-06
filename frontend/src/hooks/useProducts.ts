import { useCallback, useEffect, useState } from 'react'
import { mensajeDe } from '@/lib/errores'
import { productService } from '@/services/servicios'
import type { Product } from '@/types/product'

interface State {
  products: Product[]
  loading: boolean
  error: string | null
}

/**
 * La última lista que llegó del servidor, compartida entre páginas.
 *
 * Sin ella, al volver de una ficha el catálogo empezaba en «Cargando diseños…» y medía un
 * palmo de alto: la foto no tenía tarjeta a la que volver y la página no podía recuperar la
 * posición en la que estaba. Con ella se pinta al instante lo que ya se vio y, por detrás, se
 * pide la lista fresca por si algo cambió.
 */
let ultimaLista: Product[] | null = null

export function useProducts() {
  const [state, setState] = useState<State>(() =>
    ultimaLista
      ? { products: ultimaLista, loading: false, error: null }
      : { products: [], loading: true, error: null },
  )

  const reload = useCallback(async () => {
    // Si ya hay algo que enseñar, se refresca sin volver al estado de carga.
    if (!ultimaLista) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const products = await productService.list()
      ultimaLista = products
      setState({ products, loading: false, error: null })
    } catch (e) {
      setState((s) =>
        s.products.length > 0
          ? { ...s, loading: false }
          : { products: [], loading: false, error: mensajeDe(e, 'No se pudo cargar el catálogo') },
      )
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...state, reload }
}
