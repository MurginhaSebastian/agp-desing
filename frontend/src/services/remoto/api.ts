import type { AuthGateway, ImageUploader, ProductRepository, SettingsRepository } from '@/services/contratos'
import { http } from '@/services/http'
import type { AuthResponse } from '@/types/auth'
import type { Product } from '@/types/product'
import type { SiteSettings } from '@/types/settings'

/*
 * La API de verdad. Cada objeto es una traducción directa a `http`: aquí no hay lógica, para que
 * todo lo que decide algo viva en el backend o en los hooks.
 */

export const productosRemotos: ProductRepository = {
  list: () => http<Product[]>('/api/products'),
  getBySlug: (slug) => http<Product>(`/api/products/slug/${encodeURIComponent(slug)}`),
  getById: (id) => http<Product>(`/api/products/${id}`, { auth: true }),
  create: (dto) => http<Product>('/api/products', { method: 'POST', body: dto, auth: true }),
  update: (id, dto) => http<Product>(`/api/products/${id}`, { method: 'PUT', body: dto, auth: true }),
  remove: (id) => http<void>(`/api/products/${id}`, { method: 'DELETE', auth: true }),
}

export const ajustesRemotos: SettingsRepository = {
  get: () => http<SiteSettings>('/api/settings'),
  save: (settings) => http<SiteSettings>('/api/settings', { method: 'PUT', body: settings, auth: true }),
}

export const sesionRemota: AuthGateway = {
  login: (req) => http<AuthResponse>('/api/auth/login', { method: 'POST', body: req }),
}

/**
 * Manda el archivo tal cual: no se recomprime ni se recorta, así que la foto que se publica es
 * la que se eligió. El servidor le quita los datos escondidos (ubicación GPS, modelo del
 * teléfono) sin tocar la imagen y devuelve la dirección pública.
 */
export const imagenesRemotas: ImageUploader = {
  async subir(archivo) {
    const cuerpo = new FormData()
    cuerpo.append('archivo', archivo)
    const { url } = await http<{ url: string }>('/api/imagenes', { method: 'POST', body: cuerpo, auth: true })
    return url
  },
}
