import type { Product, ProductCreateDTO } from '@/types/product'

/**
 * Los campos editables de una obra, tal como los pide `PUT /api/products/:id` (el servidor exige
 * la ficha entera). Para cambiar solo el estado se parte de aquí y se sobrescribe ese campo.
 */
export function aDtoDeProducto(p: Product): ProductCreateDTO {
  return {
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    currency: p.currency,
    widthCm: p.widthCm,
    heightCm: p.heightCm,
    technique: p.technique,
    imageUrl: p.imageUrl,
    status: p.status,
    featured: p.featured,
  }
}
