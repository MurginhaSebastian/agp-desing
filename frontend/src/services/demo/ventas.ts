import { hoyEnLima, mesAnterior, mesDe } from '@/lib/fechas'
import { formatTelefono } from '@/lib/format'
import type { ProductRepository, SalesRepository } from '@/services/contratos'
import { ApiError } from '@/types/api'
import { PAYMENT_METHOD_LABEL, SALE_STATUS_LABEL, type Sale, type SaleInput, type SalesSummary, type TopItem } from '@/types/sale'

/*
 * Ventas en memoria para probar el panel sin backend. Siguen las mismas reglas que el servidor
 * (`Sale.java`, `SaveSaleUseCase`, `SalesSummaryUseCase`, `VentasCsv`) para que lo que se ve en el
 * modo demo sea lo que pasa de verdad.
 */

const MAX_TOP = 5

function invalido(campo: string, mensaje: string): never {
  throw new ApiError({ title: 'Datos inválidos', status: 400, detail: mensaje, errors: { [campo]: mensaje } })
}

function validar(input: SaleInput, item: string): Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> {
  const telefono = input.customerPhone.replace(/\D/g, '')
  const nombre = input.customerName.trim()
  if (item.trim().length < 2) invalido('item', 'Escribe qué se vendió')
  if (input.quantity < 1 || input.quantity > 99) invalido('quantity', 'La cantidad va de 1 a 99')
  if (!(input.totalCents > 0)) invalido('totalCents', 'El total debe ser mayor que cero')
  if (input.advanceCents < 0) invalido('advanceCents', 'El adelanto no puede ser negativo')
  if (input.advanceCents > input.totalCents) invalido('advanceCents', 'El adelanto no puede ser mayor que el total')
  if (nombre.length < 2) invalido('customerName', 'Escribe el nombre del cliente')
  if (telefono.length < 9 || telefono.length > 15) invalido('customerPhone', 'Escribe un teléfono de 9 a 15 dígitos')
  if (!input.saleDate) invalido('saleDate', 'Indica la fecha de la venta')
  if (input.deliveryDate && input.deliveryDate < input.saleDate) invalido('deliveryDate', 'La entrega no puede ser antes de la venta')
  return {
    productId: input.productId,
    item: item.trim(),
    detail: input.detail.trim(),
    quantity: input.quantity,
    totalCents: input.totalCents,
    advanceCents: input.advanceCents,
    balanceCents: input.totalCents - input.advanceCents,
    paymentMethod: input.paymentMethod,
    status: input.status,
    customerName: nombre,
    customerPhone: telefono,
    saleDate: input.saleDate,
    deliveryDate: input.deliveryDate || null,
  }
}

/** Los números del mes. Las canceladas no cuentan; lo más vendido, por obra o por nombre. */
export function resumir(ventas: Sale[], mes: string): SalesSummary {
  const vigentes = (m: string) => ventas.filter((v) => mesDe(v.saleDate) === m && v.status !== 'CANCELLED')
  const delMes = vigentes(mes)
  const grupos = new Map<string, TopItem>()
  for (const v of delMes) {
    const clave = v.productId ? `obra:${v.productId}` : `item:${v.item.toLowerCase()}`
    const g = grupos.get(clave)
    grupos.set(clave, g
      ? { ...g, quantity: g.quantity + v.quantity, totalCents: g.totalCents + v.totalCents }
      : { productId: v.productId, item: v.item, quantity: v.quantity, totalCents: v.totalCents })
  }
  return {
    month: mes,
    totalCents: delMes.reduce((s, v) => s + v.totalCents, 0),
    previousMonthTotalCents: vigentes(mesAnterior(mes)).reduce((s, v) => s + v.totalCents, 0),
    pendingCents: delMes.reduce((s, v) => s + v.balanceCents, 0),
    salesCount: delMes.length,
    topItems: [...grupos.values()].sort((a, b) => b.quantity - a.quantity || b.totalCents - a.totalCents).slice(0, MAX_TOP),
  }
}

/** El mismo CSV que da el servidor: `;`, punto decimal, BOM, fórmulas neutralizadas. */
function aCsv(ventas: Sale[]): Blob {
  const celda = (valor: string) => {
    let v = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
    if (/[;"\n\r]/.test(v)) v = `"${v.replace(/"/g, '""')}"`
    return v
  }
  const soles = (c: number) => `${Math.trunc(c / 100)}.${String(c % 100).padStart(2, '0')}`
  const filas = [
    ['Fecha', 'Cliente', 'Teléfono', 'Qué se vendió', 'Detalle', 'Cantidad', 'Total (S/)', 'Adelanto (S/)', 'Saldo (S/)', 'Pago', 'Estado', 'Entrega'],
    ...ventas.map((v) => [v.saleDate, v.customerName, formatTelefono(v.customerPhone), v.item, v.detail, String(v.quantity),
      soles(v.totalCents), soles(v.advanceCents), soles(v.balanceCents), PAYMENT_METHOD_LABEL[v.paymentMethod],
      SALE_STATUS_LABEL[v.status], v.deliveryDate ?? '']),
  ]
  return new Blob(['﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' })
}

/** Unas ventas de ejemplo para que el panel demo tenga números: de este mes y del anterior. */
function ejemplos(hoy: string): Sale[] {
  const mes = mesDe(hoy)
  const anterior = mesAnterior(mes)
  const ahora = new Date().toISOString()
  const base = { detail: '', quantity: 1, createdAt: ahora, updatedAt: ahora, deliveryDate: null }
  const venta = (v: Partial<Sale> & Pick<Sale, 'item' | 'totalCents' | 'advanceCents' | 'saleDate'>): Sale => ({
    ...base, id: crypto.randomUUID(), productId: null, paymentMethod: 'YAPE', status: 'PENDING',
    customerName: 'Cliente de ejemplo', customerPhone: '999999999', ...v, balanceCents: v.totalCents - v.advanceCents,
  })
  return [
    venta({ productId: '2b6c1c2e-9a4e-4e1a-8d6e-000000000001', item: 'Cuadro 3D Fórmula 1', totalCents: 7_500, advanceCents: 7_500,
      saleDate: `${mes}-02`, status: 'DELIVERED', customerName: 'María (ejemplo)', detail: 'Escudería y piloto favoritos' }),
    venta({ item: 'Cuadro de la promoción 2010', totalCents: 18_000, advanceCents: 9_000, saleDate: `${mes}-04`,
      status: 'IN_PRODUCTION', paymentMethod: 'TRANSFER', customerName: 'Jorge (ejemplo)', detail: '32 fotos, marco negro' }),
    venta({ productId: '2b6c1c2e-9a4e-4e1a-8d6e-000000000002', item: 'Box Aniversario Streaming', totalCents: 11_500, advanceCents: 0,
      saleDate: `${mes}-05`, paymentMethod: 'CASH_ON_DELIVERY', customerName: 'Lucía (ejemplo)' }),
    venta({ productId: '2b6c1c2e-9a4e-4e1a-8d6e-000000000001', item: 'Cuadro 3D Fórmula 1', totalCents: 7_500, advanceCents: 7_500,
      saleDate: `${anterior}-20`, status: 'DELIVERED', customerName: 'Pedro (ejemplo)' }),
  ]
}

/**
 * `productos` es el almacén demo de obras: de ahí se copia el nombre de la obra y ahí se marca
 * como vendida, igual que en el servidor.
 */
export function crearVentasDemo(productos: ProductRepository, hoy: string = hoyEnLima()): SalesRepository {
  let almacen: Sale[] = ejemplos(hoy)
  const buscar = (id: string) => {
    const v = almacen.find((x) => x.id === id)
    if (!v) throw new ApiError({ title: 'No encontrado', status: 404, detail: 'No existe una venta con ese identificador' })
    return v
  }
  const deLaObra = async (input: SaleInput) => {
    if (!input.productId) return null
    try {
      return await productos.getById(input.productId)
    } catch {
      throw new ApiError({ title: 'No encontrado', status: 404, detail: 'Esa obra ya no está en el catálogo' })
    }
  }
  const marcarSiSePide = async (input: SaleInput, estado: string | undefined) => {
    if (input.markProductSold && input.productId && estado !== 'SOLD') await productos.update(input.productId, { status: 'SOLD' })
  }
  const enPeriodo = (v: Sale, desde: string, hasta: string) => v.saleDate >= desde && v.saleDate <= hasta
  const ordenadas = (vs: Sale[]) =>
    [...vs].sort((a, b) => b.saleDate.localeCompare(a.saleDate) || b.createdAt.localeCompare(a.createdAt))

  return {
    async list({ desde, hasta }) {
      await new Promise((r) => setTimeout(r, 100))
      return structuredClone(ordenadas(almacen.filter((v) => enPeriodo(v, desde, hasta))))
    },
    async get(id) {
      return structuredClone(buscar(id))
    },
    async create(input) {
      const obra = await deLaObra(input)
      const datos = validar(input, obra ? obra.name : input.item)
      await marcarSiSePide(input, obra?.status)
      const ahora = new Date().toISOString()
      const venta: Sale = { ...datos, id: crypto.randomUUID(), createdAt: ahora, updatedAt: ahora }
      almacen = [venta, ...almacen]
      return structuredClone(venta)
    },
    async update(id, input) {
      const actual = buscar(id)
      const obra = await deLaObra(input)
      // Misma obra que ya tenía: se conserva el nombre con el que se vendió.
      const item = obra ? (actual.productId === obra.id ? actual.item : obra.name) : input.item
      const datos = validar(input, item)
      await marcarSiSePide(input, obra?.status)
      const editada: Sale = { ...actual, ...datos, updatedAt: new Date().toISOString() }
      almacen = almacen.map((v) => (v.id === id ? editada : v))
      return structuredClone(editada)
    },
    async remove(id) {
      buscar(id)
      almacen = almacen.filter((v) => v.id !== id)
    },
    async resumen(mes) {
      return resumir(almacen, mes)
    },
    async exportar({ desde, hasta }) {
      return aCsv(ordenadas(almacen.filter((v) => enPeriodo(v, desde, hasta))))
    },
  }
}

