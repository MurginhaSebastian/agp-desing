import { useCallback, useEffect, useState } from 'react'
import { productService } from '@/services/productService'
import type { Product } from '@/types/product'

interface State {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useProducts() {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const products = await productService.list()
      setState({ products, loading: false, error: null })
    } catch (e) {
      setState({ products: [], loading: false, error: e instanceof Error ? e.message : 'No se pudo cargar el catálogo' })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...state, reload }
}
