import { describe, expect, it } from 'vitest'
import { aCentimos, aTextoDeSoles } from '@/lib/dinero'

describe('aCentimos', () => {
  it('lee lo que se escribe en una casilla de soles', () => {
    expect(aCentimos('95')).toBe(9_500)
    expect(aCentimos('95.50')).toBe(9_550)
    expect(aCentimos('95,50')).toBe(9_550)
    expect(aCentimos('S/ 95')).toBe(9_500)
    expect(aCentimos('1,200.50')).toBe(120_050)
    expect(aCentimos('1,200')).toBe(120_000)
    expect(aCentimos('0.1')).toBe(10)
  })

  it('sin número que leer, NaN', () => {
    expect(aCentimos('')).toBeNaN()
    expect(aCentimos('abc')).toBeNaN()
  })
})

describe('aTextoDeSoles', () => {
  it('para rellenar la casilla al editar', () => {
    expect(aTextoDeSoles(9_500)).toBe('95')
    expect(aTextoDeSoles(9_550)).toBe('95.50')
  })
})
