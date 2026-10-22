import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VentaForm } from '@/components/admin/VentaForm'
import { ApiError } from '@/types/api'
import type { SaleInput } from '@/types/sale'

afterEach(cleanup)

const escribir = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

function montar(onSubmit: (i: SaleInput) => Promise<void> = async () => {}) {
  const spy = vi.fn(onSubmit)
  render(<VentaForm obras={[]} submitLabel="Registrar venta" onSubmit={spy} />)
  // Encargo a medida: no necesita obras del catálogo.
  fireEvent.click(screen.getByLabelText('Encargo a medida'))
  return spy
}

function rellenar() {
  escribir(/^Qué se vendió/, 'Cuadro de bodas')
  escribir(/^Nombre/, 'Rosa Pérez')
  escribir(/^Teléfono/, '987 654 321')
  escribir(/^Total/, '150')
  escribir(/^Adelanto/, '50')
}

const enviar = () => fireEvent.click(screen.getByRole('button', { name: /Registrar venta|Guardando/ }))

describe('VentaForm', () => {
  it('vacío no envía y señala los campos obligatorios', () => {
    const onSubmit = montar()
    enviar()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Escribe qué se vendió.')).toBeTruthy()
    expect(screen.getByText('El total debe ser mayor que cero.')).toBeTruthy()
    expect(screen.getByText('Escribe el nombre del cliente.')).toBeTruthy()
    expect(screen.getByText('Un teléfono de 9 a 15 dígitos.')).toBeTruthy()
  })

  it('el adelanto no puede superar el total', () => {
    const onSubmit = montar()
    rellenar()
    escribir(/^Adelanto/, '200')
    enviar()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('El adelanto no puede ser mayor que el total.')).toBeTruthy()
  })

  it('calcula lo que falta cobrar', () => {
    montar()
    escribir(/^Total/, '150')
    escribir(/^Adelanto/, '50')
    expect(screen.getByText('Falta cobrar').nextSibling?.textContent).toMatch(/100/)
  })

  it('envía los importes en céntimos y deshabilita el botón mientras guarda', async () => {
    let terminar!: () => void
    const onSubmit = montar(() => new Promise<void>((r) => (terminar = r)))
    rellenar()
    enviar()

    const boton = await screen.findByRole('button', { name: 'Guardando…' })
    expect((boton as HTMLButtonElement).disabled).toBe(true)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const enviado = onSubmit.mock.calls[0][0]
    expect(enviado).toMatchObject({ totalCents: 15000, advanceCents: 5000, productId: null, item: 'Cuadro de bodas' })

    terminar()
    await waitFor(() => expect((screen.getByRole('button', { name: 'Registrar venta' }) as HTMLButtonElement).disabled).toBe(false))
  })

  it('pinta bajo cada casilla los errores por campo del backend', async () => {
    montar(async () => {
      throw new ApiError({ title: 'Datos no válidos', status: 400, errors: { customerPhone: 'Teléfono repetido en otra venta.' } })
    })
    rellenar()
    enviar()
    expect(await screen.findByText('Teléfono repetido en otra venta.')).toBeTruthy()
  })

  it('un fallo sin detalle por campo sale como aviso general', async () => {
    montar(async () => { throw new Error('Sin conexión con el servidor') })
    rellenar()
    enviar()
    expect((await screen.findByRole('alert')).textContent).toBe('Sin conexión con el servidor')
  })
})
