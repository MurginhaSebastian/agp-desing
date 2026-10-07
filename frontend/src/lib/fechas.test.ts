import { describe, expect, it } from 'vitest'
import { fechaCorta, hoyEnLima, mesAnterior, mesDe, nombreDelMes, periodoDelMes } from '@/lib/fechas'

describe('fechas de las ventas', () => {
  it('«hoy» es el de Lima, no el de UTC', () => {
    // 8 de octubre a las 03:00 UTC = 7 de octubre a las 22:00 en Lima
    expect(hoyEnLima(new Date('2026-10-08T03:00:00Z'))).toBe('2026-10-07')
  })

  it('meses y periodos', () => {
    expect(mesDe('2026-10-07')).toBe('2026-10')
    expect(periodoDelMes('2026-02')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' })
    expect(periodoDelMes('2028-02').hasta).toBe('2028-02-29')
    expect(mesAnterior('2026-01')).toBe('2025-12')
    expect(mesAnterior('2026-10')).toBe('2026-09')
  })

  it('se leen en español', () => {
    expect(nombreDelMes('2026-10')).toBe('octubre de 2026')
    expect(fechaCorta('2026-10-07')).toMatch(/^7 oct\.? 2026$/)
  })
})
