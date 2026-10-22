import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { ProductCard } from '@/components/catalog/ProductCard'
import type { Product } from '@/types/product'

afterEach(cleanup)

const ALMACEN = 'https://abc.supabase.co/storage/v1/object/public/productos/'
const base: Product = {
  id: 'p1', name: 'Atardecer', slug: 'atardecer', description: '', priceCents: 12000, currency: 'PEN',
  widthCm: 40, heightCm: 20, technique: 'Cuadro 3D', imageUrl: '/images/obras/01.svg', status: 'AVAILABLE',
  featured: false, createdAt: '', updatedAt: '',
}

function montar(p: Partial<Product>) {
  // La tarjeta usa View Transitions, que exigen un router de datos.
  const router = createMemoryRouter([{ path: '*', element: <ProductCard product={{ ...base, ...p }} index={0} /> }])
  render(<RouterProvider router={router} />)
  const img = screen.getByRole('img', { hidden: true }) as HTMLImageElement
  const figura = img.closest('figure') as HTMLElement
  return { img, figura }
}

// jsdom serializa el valor como «2 / 1»: se compara el número.
const razon = (f: HTMLElement) => Number(f.style.aspectRatio.split('/')[0])

function cargada(img: HTMLImageElement, w: number, h: number) {
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: w })
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: h })
  fireEvent.load(img)
}

describe('ProductCard', () => {
  it('mientras carga usa la proporción en centímetros y al cargar toma la de la foto', () => {
    const { img, figura } = montar({ id: 'a' })
    expect(razon(figura)).toBe(2) // 40 / 20
    cargada(img, 300, 400)
    expect(razon(figura)).toBe(0.75)
  })

  it('una foto que reporta 0 de ancho no rompe la proporción', () => {
    const { img, figura } = montar({ id: 'b' })
    cargada(img, 0, 0)
    expect(razon(figura)).toBe(2)
  })

  it('al volver a montar la tarjeta recuerda la proporción medida', () => {
    const { img } = montar({ id: 'c' })
    cargada(img, 100, 200)
    cleanup()
    const { figura } = montar({ id: 'c' })
    expect(razon(figura)).toBe(0.5)
  })

  it('si la copia reducida no carga, vuelve a la foto original', () => {
    const original = `${ALMACEN}9a2b1c9e-8d7a-4b6c-9e1f-0a2b3c4d5e6f.jpg`
    const { img } = montar({ id: 'd', imageUrl: original })
    expect(img.getAttribute('src')).toBe(original.replace('.jpg', '.min.jpg'))
    fireEvent.error(img)
    expect(img.getAttribute('src')).toBe(original)
  })

  it('anota el estado solo si la obra no está disponible, y enlaza a su ficha', () => {
    montar({ id: 'e', status: 'SOLD' })
    expect(screen.getByText('Vendido')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Atardecer' }).getAttribute('href')).toBe('/catalogo/atardecer')
  })

  it('disponible no lleva nota de estado', () => {
    montar({ id: 'f' })
    expect(screen.queryByText('Disponible')).toBeNull()
  })
})
