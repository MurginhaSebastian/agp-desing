import { env } from '@/config/env'
import type { Product } from '@/types/product'

/** El chat del negocio, sin mensaje (las páginas legales: ahí no se viene a cotizar). */
export function enlaceWhatsApp(): string {
  return `https://wa.me/${env.whatsappNumber}`
}

/**
 * Enlace wa.me con el mensaje pre-llenado. El número es config pública.
 *
 * Con obra, el mensaje lleva la dirección de su ficha. En WhatsApp sirve de referencia: se abre
 * la obra exacta con un toque y se buscan todas sus consultas por esa dirección. Ojo: renombrar
 * la obra en el panel cambia su slug, y los mensajes viejos apuntan a la dirección anterior.
 */
export function buildWhatsAppUrl(product?: Pick<Product, 'name' | 'slug'>): string {
  const text = product
    ? `Hola, vengo de la web. Me interesa cotizar «${product.name}».\n${window.location.origin}/catalogo/${encodeURIComponent(product.slug)}`
    : 'Hola, vengo de la web. Quiero cotizar un diseño.'
  return `${enlaceWhatsApp()}?text=${encodeURIComponent(text)}`
}
