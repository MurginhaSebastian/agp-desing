import { Link } from 'react-router-dom'
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
  const ratio = product.widthCm / product.heightCm
  const sold = product.status === 'SOLD'

  return (
    <article className="group">
      {/* Enlace redundante con el del título: clicable, pero fuera del orden de tabulación
          y oculto para lectores de pantalla para no anunciar dos veces el mismo destino. */}
      <Link to={`/catalogo/${product.slug}`} className="block" tabIndex={-1} aria-hidden="true">
        <figure
          className="relative bg-nude overflow-hidden"
          style={{ aspectRatio: String(ratio) }}
        >
          <img
            src={product.imageUrl}
            alt={`${product.name} — ${product.technique}`}
            loading="lazy"
            decoding="async"
            width={product.widthCm * 10}
            height={product.heightCm * 10}
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
            <Link to={`/catalogo/${product.slug}`} className="link-underline">
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
