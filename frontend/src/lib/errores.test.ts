import { describe, expect, it } from 'vitest'
import { erroresDeCampo, mensajeDe } from '@/lib/errores'
import { ApiError } from '@/types/api'

describe('mensajeDe', () => {
  it('usa el mensaje del Error', () => {
    expect(mensajeDe(new Error('se cayo'), 'por defecto')).toBe('se cayo')
  })

  it('toma el detalle de un ApiError (que es un Error)', () => {
    const e = new ApiError({ title: 'Mal', status: 400, detail: 'falta el nombre' })
    expect(mensajeDe(e, 'por defecto')).toBe('falta el nombre')
  })

  it('cae al valor por defecto si no es un Error', () => {
    expect(mensajeDe('texto suelto', 'por defecto')).toBe('por defecto')
    expect(mensajeDe(null, 'por defecto')).toBe('por defecto')
    expect(mensajeDe(undefined, 'por defecto')).toBe('por defecto')
  })
})

describe('erroresDeCampo', () => {
  it('devuelve los errores por campo de un ApiError', () => {
    const e = new ApiError({ title: 'Mal', status: 400, errors: { name: 'requerido' } })
    expect(erroresDeCampo(e)).toEqual({ name: 'requerido' })
  })

  it('vacio para un ApiError sin errores por campo', () => {
    expect(erroresDeCampo(new ApiError({ title: 'Mal', status: 500 }))).toEqual({})
  })

  it('vacio si no es un ApiError', () => {
    expect(erroresDeCampo(new Error('otra cosa'))).toEqual({})
    expect(erroresDeCampo('texto')).toEqual({})
  })
})
