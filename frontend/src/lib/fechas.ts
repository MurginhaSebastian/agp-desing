import type { Periodo } from '@/services/contratos'

/*
 * Fechas de las ventas, siempre en hora de Lima: el taller está en Perú, y una venta apuntada a las
 * 10 de la noche no puede caer en el día siguiente porque el navegador o el servidor vayan en UTC.
 * Las fechas viajan como texto «2026-10-07» (sin hora), igual que `LocalDate` en el backend.
 */

const ZONA = 'America/Lima'

/** Hoy en Lima, «2026-10-07». */
export function hoyEnLima(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString('en-CA', { timeZone: ZONA })
}

/** El mes de una fecha, «2026-10». */
export function mesDe(fecha: string): string {
  return fecha.slice(0, 7)
}

/** Del primer al último día de un mes «2026-10». */
export function periodoDelMes(mes: string): Periodo {
  const [anio, m] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(anio, m, 0)).getUTCDate()
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimo).padStart(2, '0')}` }
}

/** El mes anterior a «2026-01» es «2025-12». */
export function mesAnterior(mes: string): string {
  const [anio, m] = mes.split('-').map(Number)
  return m === 1 ? `${anio - 1}-12` : `${anio}-${String(m - 1).padStart(2, '0')}`
}

/** «octubre de 2026» */
export function nombreDelMes(mes: string): string {
  const [anio, m] = mes.split('-').map(Number)
  return new Date(Date.UTC(anio, m - 1, 1)).toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** «7 oct 2026», para la tabla. */
export function fechaCorta(fecha: string): string {
  const [anio, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, m - 1, d)).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
