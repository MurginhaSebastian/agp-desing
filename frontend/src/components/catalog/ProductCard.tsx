import { useState } from 'react'
import { Link, useLocation, useViewTransitionState } from 'react-router-dom'
import { catalogNumber, formatDimensions, formatPrice } from '@/lib/format'
import { PRODUCT_STATUS_LABEL, type Product } from '@/types/product'

interface Props {
  product: Product
  index: number
}

/**
 * Cada cuadro se muestra con su proporción real (ancho/alto en cm) y una
 * "etiqueta de museo" debajo. La pared del catálogo es la pieza distintiva
 * de la web: nada de tarjetas iguales con sombra.
 */
export function ProductCard({ product, index }: Props) {
  const sold = product.status === 'SOLD'
  /*
   * La tarjeta toma la forma de la FOTO, no de los centímetros del panel: si no
   * coinciden (una foto vertical con medidas horizontales, por ejemplo) se recortaba
   * un tercio de la imagen. Mientras la foto carga se usa la proporción en centímetros
   * como estimación, así el hueco ya está reservado y la página no da un salto.
   */
  const [ratio, setRatio] = useState(product.widthCm / product.heightCm)

  /*
   * La foto viaja de esta tarjeta a la ficha (y de vuelta) con la transición del navegador.
   * El nombre `foto-obra` solo se le pone mientras dura el viaje y solo a ESTA tarjeta: si
   * lo llevaran todas a la vez, el navegador no sabría cuál es la foto y no animaría ninguna.
   *   - de ida: cuando hay una transición en curso hacia la ficha de este producto;
   *   - de vuelta: cuando se llega al catálogo desde la ficha de este producto.
   */
  const destino = `/catalogo/${product.slug}`
  const yendo = useViewTransitionState(destino)
  const volviendo = useViewTransitionState('/catalogo')
  const { state } = useLocation()
  const desde = (state as { desde?: string } | null)?.desde
  const viaja = yendo || (volviendo && desde === product.slug)

  // La ficha recibe el producto entero: así se pinta con la foto desde el primer instante,
  // que es cuando el navegador la fotografía para la transición.
  const enlace = { to: destino, viewTransition: true, state: { product } } as const

  return (
    <article className="group">
      {/* Enlace redundante con el del título: clicable, pero fuera del orden de tabulación
          y oculto para lectores de pantalla para no anunciar dos veces el mismo destino. */}
      <Link {...enlace} className="block" tabIndex={-1} aria-hidden="true">
        <figure
          className="relative bg-nude overflow-hidden"
          style={{ aspectRatio: String(ratio) }}
        >
          <img
            src={product.imageUrl}
            alt={`${product.name} — ${product.technique}`}
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              const img = e.currentTarget
              if (img.naturalWidth > 0) setRatio(img.naturalWidth / img.naturalHeight)
            }}
            style={{ viewTransitionName: viaja ? 'foto-obra' : undefined }}
            className={`size-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out)] motion-safe:group-hover:scale-[1.025] ${sold ? 'opacity-80' : ''}`}
          />
          {product.status !== 'AVAILABLE' && (
            <span className="absolute top-3 left-3 label bg-silk/90 text-ink px-2 py-1">
              {PRODUCT_STATUS_LABEL[product.status]}
            </span>
          )}
        </figure>
      </Link>

      <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 items-baseline">
        <span className="label tabular">{catalogNumber(index)}</span>
        <div>
          <h3 className="text-h3 leading-tight">
            <Link {...enlace} className="link-underline">
              {product.name}
            </Link>
          </h3>
          <p className="label mt-1.5">
            {product.technique} · {formatDimensions(product.widthCm, product.heightCm)}
          </p>
          <p className={`mt-2 font-body text-[0.9375rem] tabular ${sold ? 'text-ink-soft line-through' : 'text-ink'}`}>
            {formatPrice(product.priceCents, product.currency)}
          </p>
        </div>
      </div>
    </article>
  )
}
