import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductForm } from '@/components/admin/ProductForm'
import type { ProductCreateDTO } from '@/types/product'

afterEach(cleanup)

const valido: ProductCreateDTO = {
  name: 'Atardecer en Barranco',
  description: '',
  priceCents: 12000,
  currency: 'PEN',
  widthCm: 40,
  heightCm: 30,
  technique: 'Cuadro 3D',
  imageUrl: 'https://abc.supabase.co/storage/v1/object/public/productos/x.jpg',
  status: 'AVAILABLE',
  featured: false,
}

const enviar = () => fireEvent.click(screen.getByRole('button', { name: /Guardar|Guardando/ }))

describe('ProductForm', () => {
  it('vacío no envía y señala los campos obligatorios', () => {
    const onSubmit = vi.fn(async () => {})
    render(<ProductForm submitLabel="Guardar" onSubmit={onSubmit} />)
    enviar()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Escribe el nombre del producto (mínimo 2 caracteres).')).toBeTruthy()
    expect(screen.getByText('El precio debe ser mayor que cero.')).toBeTruthy()
    expect(screen.getByText('Ancho en cm, mayor que cero.')).toBeTruthy()
    expect(screen.getByText('Alto en cm, mayor que cero.')).toBeTruthy()
    expect(screen.getByText('Elige la foto del producto.')).toBeTruthy()
  })

  it('con datos válidos envía el DTO con el precio en céntimos', async () => {
    const onSubmit = vi.fn(async () => {})
    render(<ProductForm initial={valido} submitLabel="Guardar" onSubmit={onSubmit} />)
    enviar()
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Atardecer en Barranco', priceCents: 12000 })
  })

  it('muestra el error del servidor cuando onSubmit falla', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('El servidor no quiso')
    })
    render(<ProductForm initial={valido} submitLabel="Guardar" onSubmit={onSubmit} />)
    enviar()
    expect(await screen.findByText('El servidor no quiso')).toBeTruthy()
  })
})
