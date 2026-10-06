import { useState } from 'react'
import { Link, useLocation, useViewTransitionState } from 'react-router-dom'
import { catalogNumber, formatDimensions, formatPrice } from '@/lib/format'
import { fichaDeOrigen, haciaFicha } from '@/lib/navegacion'
import { PRODUCT_STATUS_LABEL, type Product } from '@/types/product'

interface Props {
  product: Product
  index: number
}

/*
 * La proporción medida de cada foto, guardada entre visitas. Sin ella, al volver al catálogo con
 * «atrás» cada tarjeta nacía otra vez con la estimación en centímetros y se corregía al cargar la
 * foto: la altura cambiaba después de colocar la página y el navegador la desplazaba unos píxeles.
 */
const proporciones = new Map<string, number>()

/**
 * Cada obra, montada en su paspartú con la proporción de su foto. El margen de abajo es más
 * ancho, como en las láminas, y ahí van a lápiz el número y el estado: ya no tapan la foto.
 * La pared del catálogo es la pieza distintiva de la web: nada de tarjetas iguales.
 */
export function ProductCard({ product, index }: Props) {
  const sold = product.status === 'SOLD'
  /*
   * La tarjeta toma la forma de la FOTO, no de los centímetros del panel: si no
   * coinciden (una foto vertical con medidas horizontales, por ejemplo) se recortaba
   * un tercio de la imagen. Mientras la foto carga se usa la proporción en centímetros
   * como estimación, así el hueco ya está reservado y la página no da un salto.
   */
  const [ratio, setRatio] = useState(() => proporciones.get(product.id) ?? product.widthCm / product.heightCm)

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
  const desde = fichaDeOrigen(state)
  const viaja = yendo || (volviendo && desde === product.slug)

  // La ficha recibe el producto entero: así se pinta con la foto desde el primer instante,
  // que es cuando el navegador la fotografía para la transición.
  const enlace = { to: destino, viewTransition: true, state: haciaFicha(product) } as const

  return (
    <article className="group">
      <div className="montada">
        {/* Enlace redundante con el del título: clicable, pero fuera del orden de tabulación
            y oculto para lectores de pantalla para no anunciar dos veces el mismo destino.
            Ocupa todo el paspartú, margen incluido: las anotaciones dejan pasar el clic. */}
        <Link {...enlace} className="block mat p-[5%] pb-10" tabIndex={-1} aria-hidden="true">
          <figure className="relative bg-silk overflow-hidden" style={{ aspectRatio: String(ratio) }}>
            <img
              src={product.imageUrl}
              alt={`${product.name} — ${product.technique}`}
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                const img = e.currentTarget
                if (img.naturalWidth > 0) {
                  const medida = img.naturalWidth / img.naturalHeight
                  proporciones.set(product.id, medida)
                  setRatio(medida)
                }
              }}
              style={{ viewTransitionName: viaja ? 'foto-obra' : undefined }}
              className={`size-full object-cover ${sold ? 'opacity-80' : ''}`}
            />
          </figure>
        </Link>
        {product.status !== 'AVAILABLE' && (
          <span className="nota !text-brand pointer-events-none absolute left-[5%] bottom-2.5">
            {PRODUCT_STATUS_LABEL[product.status]}
          </span>
        )}
        <span className="pointer-events-none absolute right-[5%] bottom-2 font-display text-[0.9375rem] text-ink-soft tabular">
          {catalogNumber(index)}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-h3">
          <Link {...enlace} className="link-underline">
            {product.name}
          </Link>
        </h3>
        {/* Formato y medidas, separados por una raya fina en vez de un punto. */}
        <p className="nota mt-2 flex flex-wrap items-center gap-x-2.5">
          <span>{product.technique}</span>
          <span aria-hidden="true" className="h-3 w-px bg-greige" />
          <span>{formatDimensions(product.widthCm, product.heightCm)}</span>
        </p>
        <p className={`mt-2 font-display text-[1.1875rem] tabular ${sold ? 'text-ink-soft line-through' : 'text-ink'}`}>
          {formatPrice(product.priceCents, product.currency)}
        </p>
      </div>
    </article>
  )
}
