/*
 * Espejo exacto de SaleResponse.java y SalesSummaryResponse.java: si cambia uno, cambia el otro.
 * Las ventas solo existen en el panel: nada de esto se pinta nunca en la web pública.
 */

export type PaymentMethod = 'YAPE' | 'TRANSFER' | 'CASH_ON_DELIVERY'
export type SaleStatus = 'PENDING' | 'IN_PRODUCTION' | 'DELIVERED' | 'CANCELLED'

export interface Sale {
  id: string
  /** La obra del catálogo, o null si es un encargo a medida (o la obra se borró después). */
  productId: string | null
  /** Qué se vendió: el nombre de la obra al venderla, o lo que se escribió a mano. */
  item: string
  detail: string
  quantity: number
  /** En céntimos de sol, como `priceCents`. */
  totalCents: number
  advanceCents: number
  /** Lo que falta cobrar (total − adelanto); lo calcula el servidor. */
  balanceCents: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  customerName: string
  /** Solo dígitos. */
  customerPhone: string
  /** Fechas sin hora, «2026-10-07». */
  saleDate: string
  deliveryDate: string | null
  createdAt: string
  updatedAt: string
}

/** Lo que se manda al registrar o editar. `item` puede ir vacío si hay obra: se copia su nombre. */
export interface SaleInput {
  productId: string | null
  item: string
  detail: string
  quantity: number
  totalCents: number
  advanceCents: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  customerName: string
  customerPhone: string
  saleDate: string
  deliveryDate: string | null
  /** Si la obra pasa a «Vendido» en el catálogo al guardar. */
  markProductSold: boolean
}

export interface TopItem {
  productId: string | null
  item: string
  quantity: number
  totalCents: number
}

export interface SalesSummary {
  /** «2026-10» */
  month: string
  totalCents: number
  previousMonthTotalCents: number
  pendingCents: number
  salesCount: number
  topItems: TopItem[]
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  YAPE: 'Yape',
  TRANSFER: 'Transferencia',
  CASH_ON_DELIVERY: 'Contraentrega',
}

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  PENDING: 'Pendiente',
  IN_PRODUCTION: 'En producción',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
}
