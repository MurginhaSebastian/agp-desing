import { describe, expect, it } from 'vitest'
import {
  esVuelta,
  fichaDeOrigen,
  haciaFicha,
  obraTraida,
  paraVolverA,
  rutaDeVuelta,
  volviendoDe,
} from '@/lib/navegacion'
import type { Product } from '@/types/product'

describe('navegacion', () => {
  const obra = { id: '1', slug: 'seda-i' } as Product

  it('lo que se manda se lee igual al otro lado', () => {
    expect(obraTraida(haciaFicha(obra))).toBe(obra)
    expect(fichaDeOrigen(volviendoDe('seda-i'))).toBe('seda-i')
    expect(esVuelta(volviendoDe('seda-i'))).toBe(true)
    expect(rutaDeVuelta(paraVolverA('/admin/portada'), '/admin')).toBe('/admin/portada')
  })

  it('sin estado (enlace directo, recarga) no hay nada que leer', () => {
    for (const state of [null, undefined, 'texto', 3]) {
      expect(obraTraida(state)).toBeUndefined()
      expect(fichaDeOrigen(state)).toBeUndefined()
      expect(esVuelta(state)).toBe(false)
      expect(rutaDeVuelta(state, '/admin')).toBe('/admin')
    }
  })

  it('un estado de otra forma no se toma por bueno', () => {
    expect(obraTraida({ product: 'no es una obra' })).toBeUndefined()
    expect(esVuelta({ volver: 'si' })).toBe(false)
    expect(rutaDeVuelta({ from: 42 }, '/admin')).toBe('/admin')
  })
})
