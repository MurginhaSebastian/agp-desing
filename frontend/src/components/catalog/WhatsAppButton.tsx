import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import type { Product } from '@/types/product'

interface Props {
  product?: Pick<Product, 'name' | 'status'>
  className?: string
  variant?: 'primary' | 'secondary' | 'on-dark'
}

/**
 * El "botón inteligente": no hay carrito. Abre WhatsApp con el mensaje
 * pre-llenado con el nombre del cuadro.
 */
export function WhatsAppButton({ product, className = '', variant = 'primary' }: Props) {
  const label = product?.status === 'SOLD' ? 'Pedir uno similar' : product ? 'Cotizar este cuadro' : 'Cotizar por WhatsApp'
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-on-dark'
  return (
    <a
      href={buildWhatsAppUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} ${className}`}
    >
      <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
      {label}
    </a>
  )
}
