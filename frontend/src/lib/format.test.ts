import { describe, expect, it } from 'vitest'
import { catalogNumber, formatDimensions, formatPrice as formatear } from '@/lib/format'

/** Intl separa la moneda con un espacio duro; aquí se compara con uno normal para que se lea. */
const formatPrice = (...args: Parameters<typeof formatear>) => formatear(...args).replace(/ /g, ' ')

describe('format', () => {
  it('pone los precios en soles sin decimales, al estilo peruano', () => {
    expect(formatPrice(9_500, 'PEN')).toBe('S/ 95')
    expect(formatPrice(120_000, 'PEN')).toBe('S/ 1,200')
    expect(formatPrice(9_550, 'PEN')).toBe('S/ 96')
  })

  it('pone los dólares al estilo de EE. UU.', () => {
    expect(formatPrice(9_500, 'USD')).toBe('$95')
  })

  it('escribe las medidas con el signo de multiplicar', () => {
    expect(formatDimensions(30, 40)).toBe('30 × 40 cm')
  })

  it('numera el catálogo desde 1 con tres cifras', () => {
    expect(catalogNumber(0)).toBe('Nº 001')
    expect(catalogNumber(41)).toBe('Nº 042')
  })
})
