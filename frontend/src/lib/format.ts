import type { Currency } from '@/types/product'

const formatters: Record<Currency, Intl.NumberFormat> = {
  COP: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
}

export function formatPrice(priceCents: number, currency: Currency): string {
  return formatters[currency].format(priceCents / 100)
}

export function formatDimensions(widthCm: number, heightCm: number): string {
  return `${widthCm} × ${heightCm} cm`
}

/** Nº 004 — numeración de catálogo a partir del índice */
export function catalogNumber(index: number): string {
  return `Nº ${String(index + 1).padStart(3, '0')}`
}
