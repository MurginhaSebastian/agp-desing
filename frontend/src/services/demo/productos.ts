import { mockProducts } from '@/data/mock-products'
import type { ProductRepository } from '@/services/contratos'
import type { Product } from '@/types/product'

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Obras en memoria, empezando por las de ejemplo. Se pierden al recargar, a propósito.
 * Siempre se entregan copias: quien las reciba puede cambiarlas sin tocar el almacén.
 */
export function crearProductosDemo(): ProductRepository {
  let almacen: Product[] = structuredClone(mockProducts)

  return {
    async list() {
      await new Promise((r) => setTimeout(r, 120))
      return structuredClone(almacen)
    },
    async getBySlug(slug) {
      const p = almacen.find((x) => x.slug === slug)
      if (!p) throw new Error('No encontrado')
      return structuredClone(p)
    },
    async getById(id) {
      const p = almacen.find((x) => x.id === id)
      if (!p) throw new Error('No encontrado')
      return structuredClone(p)
    },
    async create(dto) {
      const now = new Date().toISOString()
      const p: Product = { ...dto, id: crypto.randomUUID(), slug: slugify(dto.name), createdAt: now, updatedAt: now }
      almacen = [p, ...almacen]
      return structuredClone(p)
    },
    async update(id, dto) {
      const i = almacen.findIndex((x) => x.id === id)
      if (i < 0) throw new Error('No encontrado')
      const updated: Product = { ...almacen[i], ...dto, updatedAt: new Date().toISOString() }
      if (dto.name) updated.slug = slugify(dto.name)
      almacen[i] = updated
      return structuredClone(updated)
    },
    async remove(id) {
      almacen = almacen.filter((x) => x.id !== id)
    },
  }
}
