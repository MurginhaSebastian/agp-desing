import { isDemoMode } from '@/config/env'
import { mockProducts } from '@/data/mock-products'
import { http } from '@/services/http'
import type { Product, ProductCreateDTO, ProductUpdateDTO } from '@/types/product'

/**
 * Única puerta hacia /api/products.
 * En modo demo (sin VITE_API_URL) responde con datos locales en memoria,
 * así el catálogo y el admin se pueden probar sin backend.
 */

let demoStore: Product[] = structuredClone(mockProducts)

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const demo = {
  async list(): Promise<Product[]> {
    await new Promise((r) => setTimeout(r, 120))
    return structuredClone(demoStore)
  },
  async getBySlug(slug: string): Promise<Product> {
    const p = demoStore.find((x) => x.slug === slug)
    if (!p) throw new Error('No encontrado')
    return structuredClone(p)
  },
  async getById(id: string): Promise<Product> {
    const p = demoStore.find((x) => x.id === id)
    if (!p) throw new Error('No encontrado')
    return structuredClone(p)
  },
  async create(dto: ProductCreateDTO): Promise<Product> {
    const now = new Date().toISOString()
    const p: Product = { ...dto, id: crypto.randomUUID(), slug: slugify(dto.name), createdAt: now, updatedAt: now }
    demoStore = [p, ...demoStore]
    return structuredClone(p)
  },
  async update(id: string, dto: ProductUpdateDTO): Promise<Product> {
    const i = demoStore.findIndex((x) => x.id === id)
    if (i < 0) throw new Error('No encontrado')
    const updated: Product = { ...demoStore[i], ...dto, updatedAt: new Date().toISOString() }
    if (dto.name) updated.slug = slugify(dto.name)
    demoStore[i] = updated
    return structuredClone(updated)
  },
  async remove(id: string): Promise<void> {
    demoStore = demoStore.filter((x) => x.id !== id)
  },
}

const remote = {
  list: () => http<Product[]>('/api/products'),
  getBySlug: (slug: string) => http<Product>(`/api/products/slug/${encodeURIComponent(slug)}`),
  getById: (id: string) => http<Product>(`/api/products/${id}`, { auth: true }),
  create: (dto: ProductCreateDTO) => http<Product>('/api/products', { method: 'POST', body: dto, auth: true }),
  update: (id: string, dto: ProductUpdateDTO) =>
    http<Product>(`/api/products/${id}`, { method: 'PUT', body: dto, auth: true }),
  remove: (id: string) => http<void>(`/api/products/${id}`, { method: 'DELETE', auth: true }),
}

export const productService = isDemoMode ? demo : remote
