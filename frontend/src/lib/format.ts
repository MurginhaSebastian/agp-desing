import type { Currency } from '@/types/product'

const formatters: Record<Currency, Intl.NumberFormat> = {
  PEN: new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
}

export function formatPrice(priceCents: number, currency: Currency): string {
  return formatters[currency].format(priceCents / 100)
}

const conCentimos = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 })
const sinCentimos = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

/**
 * Soles exactos, para las cuentas de las ventas: «S/ 75.50», y «S/ 95» si no hay céntimos.
 * `formatPrice` redondea al sol (vale para un precio de catálogo, no para lo que falta cobrar).
 */
export function formatSoles(cents: number): string {
  return (cents % 100 === 0 ? sinCentimos : conCentimos).format(cents / 100)
}

/** «51987654321» → «51 987 654 321»: los últimos nueve en grupos de tres (igual que en el Excel). */
export function formatTelefono(digitos: string): string {
  if (digitos.length < 9) return digitos
  const local = digitos.slice(-9)
  return [digitos.slice(0, -9), local.slice(0, 3), local.slice(3, 6), local.slice(6)].filter(Boolean).join(' ')
}

export function formatDimensions(widthCm: number, heightCm: number): string {
  return `${widthCm} × ${heightCm} cm`
}

/** Nº 004 — numeración de catálogo a partir del índice */
export function catalogNumber(index: number): string {
  return `Nº ${String(index + 1).padStart(3, '0')}`
}
