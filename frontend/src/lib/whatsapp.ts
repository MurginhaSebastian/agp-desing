import { env } from '@/config/env'
import type { Product } from '@/types/product'

/** El chat del negocio, sin mensaje (las páginas legales: ahí no se viene a cotizar). */
export function enlaceWhatsApp(): string {
  return `https://wa.me/${env.whatsappNumber}`
}

/** Enlace wa.me con el mensaje pre-llenado. El número es config pública. */
export function buildWhatsAppUrl(product?: Pick<Product, 'name'>): string {
  const text = product
    ? `Hola, vengo de la web. Me interesa cotizar «${product.name}».`
    : 'Hola, vengo de la web. Quiero cotizar un diseño.'
  return `${enlaceWhatsApp()}?text=${encodeURIComponent(text)}`
}
