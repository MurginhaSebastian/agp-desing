import type { AuthResponse, LoginRequest } from '@/types/auth'
import type { Product, ProductCreateDTO, ProductUpdateDTO } from '@/types/product'
import type { Sale, SaleInput, SalesSummary } from '@/types/sale'
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

/** Un periodo de fechas, ambas incluidas, en formato «2026-10-07». */
export interface Periodo {
  desde: string
  hasta: string
}

/** /api/sales — solo con sesión de administrador. */
export interface SalesRepository {
  list(periodo: Periodo): Promise<Sale[]>
  get(id: string): Promise<Sale>
  create(input: SaleInput): Promise<Sale>
  update(id: string, input: SaleInput): Promise<Sale>
  remove(id: string): Promise<void>
  /** `mes` como «2026-10». */
  resumen(mes: string): Promise<SalesSummary>
  /** El CSV para Excel del periodo, listo para descargar. */
  exportar(periodo: Periodo): Promise<Blob>
}

export interface Servicios {
  productos: ProductRepository
  ajustes: SettingsRepository
  sesion: AuthGateway
  imagenes: ImageUploader
  ventas: SalesRepository
}
