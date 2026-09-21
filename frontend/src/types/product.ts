export type ProductStatus = 'AVAILABLE' | 'SOLD' | 'COMMISSION'
export type Currency = 'PEN' | 'USD'

export interface Product {
  id: string // UUID generado por el backend
  name: string
  slug: string
  description: string // texto plano; React lo escapa al renderizar
  priceCents: number // entero — nunca float para dinero
  currency: Currency
  widthCm: number
  heightCm: number
  technique: string // "Óleo sobre lienzo", "Acrílico", ...
  imageUrl: string
  status: ProductStatus
  featured: boolean
  createdAt: string // ISO 8601
  updatedAt: string
}

export type ProductCreateDTO = Omit<Product, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
export type ProductUpdateDTO = Partial<ProductCreateDTO>

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  AVAILABLE: 'Disponible',
  SOLD: 'Vendido',
  COMMISSION: 'Por encargo',
}
