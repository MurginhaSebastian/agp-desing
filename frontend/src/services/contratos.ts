import type { AuthResponse, LoginRequest } from '@/types/auth'
import type { Product, ProductCreateDTO, ProductUpdateDTO } from '@/types/product'
import type { SiteSettings } from '@/types/settings'

/*
 * Lo que la web le pide a los datos, sin decir de dónde salen.
 *
 * Hay dos implementaciones de cada contrato: `demo/` (en memoria, para ver la web y el panel sin
 * backend) y `remoto/` (la API de verdad). Antes eran dos objetos sueltos y el tipo del servicio
 * era la unión de los dos: si al demo le faltaba un método, TypeScript no avisaba. Ahora las dos
 * cumplen el mismo contrato y `servicios.ts` elige una sola vez.
 *
 * Un recurso nuevo (pedidos, categorías…) = un contrato aquí, una implementación en cada carpeta
 * y una línea en `crearServicios`.
 */

/** /api/products */
export interface ProductRepository {
  list(): Promise<Product[]>
  getBySlug(slug: string): Promise<Product>
  getById(id: string): Promise<Product>
  create(dto: ProductCreateDTO): Promise<Product>
  update(id: string, dto: ProductUpdateDTO): Promise<Product>
  remove(id: string): Promise<void>
}

/** /api/settings */
export interface SettingsRepository {
  get(): Promise<SiteSettings>
  save(settings: SiteSettings): Promise<SiteSettings>
}

/** /api/auth */
export interface AuthGateway {
  login(req: LoginRequest): Promise<AuthResponse>
}

/** /api/imagenes: sube el archivo tal cual y devuelve su dirección pública. */
export interface ImageUploader {
  subir(archivo: File): Promise<string>
}

export interface Servicios {
  productos: ProductRepository
  ajustes: SettingsRepository
  sesion: AuthGateway
  imagenes: ImageUploader
}
