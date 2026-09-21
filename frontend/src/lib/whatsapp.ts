import { env } from '@/config/env'
import type { Product } from '@/types/product'

/** Enlace wa.me con el mensaje pre-llenado. El número es config pública. */
export function buildWhatsAppUrl(product?: Pick<Product, 'name'>): string {
  const text = product
    ? `Hola, vengo de la web. Me interesa cotizar el cuadro "${product.name}".`
    : 'Hola, vengo de la web. Quiero cotizar un cuadro.'
  return `https://wa.me/${env.whatsappNumber}?text=${encodeURIComponent(text)}`
}
