import { Conversar, FlechaDerecha } from '@/components/ui/iconos'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import type { Product } from '@/types/product'

interface Props {
  product?: Pick<Product, 'name' | 'status'>
  className?: string
  /**
   * primary: el botón principal (una hoja roja).
   * secondary: enlace de texto con flecha, para acompañar a otro botón sin competir con él.
   * on-dark: hoja clara, sobre la hoja roja de contacto.
   */
  variant?: 'primary' | 'secondary' | 'on-dark'
}

/**
 * El "botón inteligente": no hay carrito. Abre WhatsApp con el mensaje
 * pre-llenado con el nombre de la pieza.
 */
export function WhatsAppButton({ product, className = '', variant = 'primary' }: Props) {
  const label = product?.status === 'SOLD' ? 'Pedir uno similar' : product ? 'Cotizar esta pieza' : 'Cotizar por WhatsApp'

  if (variant === 'secondary') {
    return (
      <a href={buildWhatsAppUrl(product)} target="_blank" rel="noopener noreferrer" className={`enlace-flecha ${className}`}>
        {label}
        <FlechaDerecha size={18} />
      </a>
    )
  }

  return (
    <a
      href={buildWhatsAppUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      className={`boton ${variant === 'on-dark' ? 'boton-claro' : ''} ${className}`}
    >
      <Conversar size={18} />
      {label}
    </a>
  )
}
