import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearProductosDemo } from '@/services/demo/productos'
import { crearVentasDemo, resumir } from '@/services/demo/ventas'
import { ApiError } from '@/types/api'
import type { Sale, SaleInput } from '@/types/sale'

const HOY = '2026-10-07'
const F1 = '2b6c1c2e-9a4e-4e1a-8d6e-000000000001' // «Cuadro 3D Fórmula 1» de los ejemplos

const entrada = (extra: Partial<SaleInput> = {}): SaleInput => ({
  productId: null, item: 'Encargo de prueba', detail: '', quantity: 1, totalCents: 10_000, advanceCents: 4_000,
  paymentMethod: 'YAPE', status: 'PENDING', customerName: 'Ana Torres', customerPhone: '+51 987 654 321',
  saleDate: HOY, deliveryDate: null, markProductSold: false, ...extra,
})

describe('ventas en modo demo', () => {
  let productos: ReturnType<typeof crearProductosDemo>
  let ventas: ReturnType<typeof crearVentasDemo>
  beforeEach(() => {
    vi.useRealTimers()
    productos = crearProductosDemo()
    ventas = crearVentasDemo(productos, HOY)
  })

  it('trae ventas de ejemplo de este mes y del anterior', async () => {
    expect(await ventas.list({ desde: '2026-10-01', hasta: '2026-10-31' })).toHaveLength(3)
    expect(await ventas.list({ desde: '2026-09-01', hasta: '2026-09-30' })).toHaveLength(1)
  })

  it('un encargo a medida guarda lo escrito, limpia el teléfono y calcula el saldo', async () => {
    const v = await ventas.create(entrada())
    expect(v.item).toBe('Encargo de prueba')
    expect(v.customerPhone).toBe('51987654321')
    expect(v.balanceCents).toBe(6_000)
  })

  it('con obra copia su nombre y la marca vendida solo si se pide', async () => {
    const v = await ventas.create(entrada({ productId: F1, item: '', markProductSold: false }))
    expect(v.item).toBe('Cuadro 3D Fórmula 1')
    expect((await productos.getById(F1)).status).toBe('AVAILABLE')
    await ventas.create(entrada({ productId: F1, item: '', markProductSold: true }))
    expect((await productos.getById(F1)).status).toBe('SOLD')
  })

  it('los errores llegan por campo, como los del servidor', async () => {
    const error = await ventas.create(entrada({ advanceCents: 20_000 })).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).fieldErrors.advanceCents).toBe('El adelanto no puede ser mayor que el total')
    await expect(ventas.create(entrada({ customerPhone: '123' }))).rejects.toMatchObject({ fieldErrors: { customerPhone: expect.any(String) } })
    await expect(ventas.create(entrada({ deliveryDate: '2026-10-01' }))).rejects.toMatchObject({ fieldErrors: { deliveryDate: expect.any(String) } })
  })

  it('editar, borrar y lo que no existe', async () => {
    const v = await ventas.create(entrada())
    const editada = await ventas.update(v.id, entrada({ status: 'DELIVERED', advanceCents: 10_000 }))
    expect(editada.balanceCents).toBe(0)
    await ventas.remove(v.id)
    await expect(ventas.get(v.id)).rejects.toMatchObject({ status: 404 })
  })

  it('el CSV es el mismo que da el servidor', async () => {
    await ventas.create(entrada({ customerName: '=HYPERLINK("x")', detail: 'Fotos; nombres' }))
    const csv = await (await ventas.exportar({ desde: HOY, hasta: HOY })).text()
    const lineas = csv.replace(/^﻿/, '').split('\r\n')
    expect(lineas[0]).toBe('Fecha;Cliente;Teléfono;Qué se vendió;Detalle;Cantidad;Total (S/);Adelanto (S/);Saldo (S/);Pago;Estado;Entrega')
    expect(lineas[1]).toBe(`${HOY};"'=HYPERLINK(""x"")";51 987 654 321;Encargo de prueba;"Fotos; nombres";1;100.00;40.00;60.00;Yape;Pendiente;`)
  })
})

describe('resumir', () => {
  const venta = (v: Partial<Sale>): Sale => ({
    id: crypto.randomUUID(), productId: null, item: 'x', detail: '', quantity: 1, totalCents: 100, advanceCents: 0,
    balanceCents: 100, paymentMethod: 'YAPE', status: 'PENDING', customerName: 'a', customerPhone: '999999999',
    saleDate: '2026-10-03', deliveryDate: null, createdAt: '', updatedAt: '', ...v,
  })

  it('cuenta el mes, el anterior y lo que falta cobrar, sin las canceladas', () => {
    const r = resumir([
      venta({ totalCents: 10_000, advanceCents: 4_000, balanceCents: 6_000 }),
      venta({ totalCents: 5_000, status: 'DELIVERED', balanceCents: 5_000 }),
      venta({ totalCents: 99_000, status: 'CANCELLED', balanceCents: 99_000 }),
      venta({ totalCents: 7_000, saleDate: '2026-09-20' }),
    ], '2026-10')
    expect(r).toMatchObject({ month: '2026-10', totalCents: 15_000, previousMonthTotalCents: 7_000, pendingCents: 11_000, salesCount: 2 })
  })

  it('lo más vendido junta por obra y, sin obra, por nombre', () => {
    const r = resumir([
      venta({ productId: 'a', item: 'Seda I', quantity: 2 }),
      venta({ productId: 'a', item: 'Seda I', quantity: 1 }),
      venta({ item: 'Box', quantity: 1 }),
      venta({ item: 'box', quantity: 1 }),
    ], '2026-10')
    expect(r.topItems.map((t) => [t.item, t.quantity])).toEqual([['Seda I', 3], ['Box', 2]])
  })
})
