import { describe, expect, it } from 'vitest'
import { aDtoDeProducto } from '@/lib/productos'
import type { Product } from '@/types/product'

const obra: Product = {
  id: '3cb2593c-f366-4d0c-93cc-bc843839d4aa',
  name: 'Box 3D Album',
  slug: 'box-3d-album',
  description: 'Un cuadro de prueba',
  priceCents: 12_000,
  currency: 'PEN',
  widthCm: 30,
  heightCm: 40,
  technique: 'Cuadro 3D',
  imageUrl: 'https://ejemplo/foto.jpg',
  status: 'AVAILABLE',
  featured: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-02T00:00:00Z',
}

describe('aDtoDeProducto', () => {
  it('copia los campos editables tal cual', () => {
    expect(aDtoDeProducto(obra)).toEqual({
      name: 'Box 3D Album',
      description: 'Un cuadro de prueba',
      priceCents: 12_000,
      currency: 'PEN',
      widthCm: 30,
      heightCm: 40,
      technique: 'Cuadro 3D',
      imageUrl: 'https://ejemplo/foto.jpg',
      status: 'AVAILABLE',
      featured: true,
    })
  })

  it('deja fuera lo que pone el servidor (id, slug, fechas)', () => {
    const dto = aDtoDeProducto(obra)
    expect('id' in dto).toBe(false)
    expect('slug' in dto).toBe(false)
    expect('createdAt' in dto).toBe(false)
    expect('updatedAt' in dto).toBe(false)
  })
})
