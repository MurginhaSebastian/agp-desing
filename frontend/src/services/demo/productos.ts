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

/** El almacén del demo, más qué fotos están usando sus obras (para soltar las demás). */
export interface ProductosDemo extends ProductRepository {
  fotosEnUso(): string[]
}

/**
 * Obras en memoria, empezando por las de ejemplo. Se pierden al recargar, a propósito.
 * Siempre se entregan copias: quien las reciba puede cambiarlas sin tocar el almacén.
 * `alCambiar` se llama después de cada alta, edición o borrado.
 */
export function crearProductosDemo(alCambiar: () => void = () => {}): ProductosDemo {
  let almacen: Product[] = structuredClone(mockProducts)

  return {
    fotosEnUso: () => almacen.map((p) => p.imageUrl),
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
      // Igual que el backend: si el slug lo conserva una obra renombrada, se usa «-2», «-3»…
      const base = slugify(dto.name)
      let slug = base
      for (let n = 2; almacen.some((x) => x.slug === slug); n++) slug = `${base}-${n}`
      const p: Product = { ...dto, id: crypto.randomUUID(), slug, createdAt: now, updatedAt: now }
      almacen = [p, ...almacen]
      alCambiar()
      return structuredClone(p)
    },
    async update(id, dto) {
      const i = almacen.findIndex((x) => x.id === id)
      if (i < 0) throw new Error('No encontrado')
      // El slug no cambia al renombrar: es la dirección pública de la obra (igual que en el backend).
      const updated: Product = { ...almacen[i], ...dto, slug: almacen[i].slug, updatedAt: new Date().toISOString() }
      almacen[i] = updated
      alCambiar()
      return structuredClone(updated)
    },
    async remove(id) {
      almacen = almacen.filter((x) => x.id !== id)
      alCambiar()
    },
  }
}
