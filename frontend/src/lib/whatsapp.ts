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
 * la obra exacta con un toque y se buscan todas sus consultas por esa dirección. La dirección no
 * cambia aunque se renombre la obra en el panel, así que los mensajes viejos siguen valiendo.
 */
export function buildWhatsAppUrl(product?: Pick<Product, 'name' | 'slug'>): string {
  const text = product
    ? `¡Hola! Vi el diseño «${product.name}» en su web y me encantó. ¿Podrían darme información para personalizar uno?\n${window.location.origin}/catalogo/${encodeURIComponent(product.slug)}`
    : '¡Hola! Estuve viendo su catálogo en la web y me gustaría cotizar un diseño personalizado.'
  return `${enlaceWhatsApp()}?text=${encodeURIComponent(text)}`
}
