import { useEffect, useState } from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { Link, useLocation, useParams } from 'react-router-dom'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { CajaVacia } from '@/components/ui/CajaVacia'
import { FlechaIzquierda } from '@/components/ui/iconos'
import { Reveal } from '@/components/ui/Reveal'
import { formatDimensions, formatPrice } from '@/lib/format'
import { productService } from '@/services/productService'
import { PRODUCT_STATUS_LABEL, type Product } from '@/types/product'

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  /*
   * Si se llega desde una tarjeta, el producto viene con la navegación y la ficha se pinta
   * entera desde el primer instante. Hace falta para la transición: el navegador fotografía
   * la página nueva en cuanto cambia la ruta, y un «Cargando diseño…» no tiene foto a la que
   * llegar. Aun así se pide al servidor, por si algo cambió desde que se cargó el catálogo.
   */
  const { state: navegacion } = useLocation()
  const traido = (navegacion as { product?: Product } | null)?.product
  const inicial = traido && traido.slug === slug ? traido : null

  const [product, setProduct] = useState<Product | null>(inicial)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>(inicial ? 'ok' : 'loading')

  useEffect(() => {
    let alive = true
    if (inicial) document.title = `${inicial.name} — AGP Desing`
    else setState('loading')
    productService
      .getBySlug(slug)
      .then((p) => {
        if (!alive) return
        setProduct(p)
        setState('ok')
        document.title = `${p.name} — AGP Desing`
      })
      // Si ya se está enseñando el producto que trajo la tarjeta, un fallo de red al
      // refrescarlo no convierte la ficha en un «no existe».
      .catch(() => alive && !inicial && setState('missing'))
    return () => {
      alive = false
      document.title = 'AGP Desing - Regalos con intención'
    }
  }, [slug, inicial])

  if (state === 'loading') {
    // La forma de la ficha mientras llega: la foto montada a un lado y la etiqueta al otro.
    return (
      <div className="container-x pt-8 pb-24 md:pt-12 md:pb-32">
        <p className="sr-only" role="status">Cargando diseño…</p>
        <div aria-hidden="true" className="mt-19 grid gap-10 md:grid-cols-12 md:gap-10 lg:gap-16">
          <div className="md:col-span-6 lg:col-span-7 paspartu capa-2 p-4 md:p-6">
            <div className="esqueleto aspect-[4/3] max-h-[70vh]" />
          </div>
          <div className="md:col-span-6 lg:col-span-4 lg:col-start-9 space-y-4">
            <div className="esqueleto h-11 w-4/5" />
            <div className="esqueleto h-11 w-3/5" />
            <div className="papel capa-2 mt-8 h-44" />
          </div>
        </div>
      </div>
    )
  }

  if (state === 'missing' || !product) {
    return (
      <CajaVacia
        titulo="Ese diseño aún no existe. ¡Escríbenos para crearlo!"
        texto="Puede que ya no esté en el catálogo o que el enlace esté mal escrito."
      >
        <Link to="/catalogo" className="boton">
          <FlechaIzquierda size={18} /> Volver al catálogo
        </Link>
      </CajaVacia>
    )
  }

  const vendido = product.status === 'SOLD'

  return (
    <article className="container-x pt-8 pb-24 md:pt-12 md:pb-32">
      {/* Vuelta con la foto viajando a su tarjeta, y el catálogo en la posición en que se dejó. */}
      <Link to="/catalogo" viewTransition state={{ desde: product.slug, volver: true }} className="enlace-flecha enlace-atras mb-8">
        <FlechaIzquierda size={18} /> Catálogo
      </Link>

      <div className="grid gap-10 md:grid-cols-12 md:gap-10 lg:gap-16">
        {/*
          La foto se ve ENTERA: aquí manda la imagen, no los centímetros del panel.
          Antes la caja tomaba su forma de widthCm/heightCm y el `object-cover` recortaba
          lo que sobrara; con el tope de altura en escritorio llegaba a comerse el 38 %.
          El tope sigue (si no, en tablet el precio se iba una pantalla abajo), pero ahora
          la imagen se encoge para caber en vez de recortarse.

          Sin `Reveal`: la foto no entra con un fundido propio porque la trae la transición desde
          la tarjeta. Dos animaciones sobre la misma foto se pisarían.

          Al pulsarla se amplía a pantalla completa, también entera. El visor se cierra con otro
          toque, con Esc o al hacer scroll, y devuelve el foco al botón de ampliar.

          El marco hueso no va en la figura sino en el envoltorio del visor (clase `foto-ficha`
          en index.css). Con la figura ajustada a su contenido, el `max-w-full` de la foto no
          tenía un ancho con el que medirse y el navegador la dejaba en 0 × 0. Ahora la figura
          ocupa la columna, que sí tiene ancho, y el marco sigue abrazando la foto.
        */}
        <figure className="foto-ficha md:col-span-6 lg:col-span-7 self-start flex justify-center">
          <Zoom a11yNameButtonZoom="Ampliar foto" a11yNameButtonUnzoom="Cerrar foto ampliada" zoomMargin={24}>
            <img
              src={product.imageUrl}
              alt={`${product.name} — ${product.technique}, ${formatDimensions(product.widthCm, product.heightCm)}`}
              className="w-auto max-w-full max-h-[70vh] object-contain"
              style={{ viewTransitionName: 'foto-obra' }}
              fetchPriority="high"
            />
          </Zoom>
        </figure>

        {/*
          Ficha, pegada al scroll en escritorio. El estado va antes del nombre, como dato y no
          como rótulo; los datos van en una etiqueta de papel con su ojal, como la que cuelga de
          una pieza terminada.
        */}
        <Reveal delay={80} className="md:col-span-6 lg:col-span-4 lg:col-start-9 lg:sticky lg:top-28 lg:self-start">
          <p className={`nota ${vendido ? '' : '!text-brand'}`}>{PRODUCT_STATUS_LABEL[product.status]}</p>
          {/* Más pequeño que un h2 de sección: los nombres de las obras son largos y la columna, estrecha. */}
          <h1 className="mt-3 text-[clamp(1.9rem,1.3rem+1.6vw,2.75rem)] leading-[1.08]">{product.name}</h1>

          <div className="papel capa-2 relative mt-8 px-6 pt-5 pb-6">
            {/* El ojal: un agujero de verdad, con la sombra por dentro. */}
            <span
              aria-hidden="true"
              className="absolute top-4 right-4 size-3 rounded-full bg-oat shadow-[inset_1px_1px_2px_color-mix(in_oklch,var(--color-bordeaux)_45%,transparent)]"
            />
            <dl className="divide-y divide-oat">
              <div className="flex items-baseline justify-between gap-6 py-3 first:pt-0">
                <dt className="nota">Formato</dt>
                <dd className="text-right font-display text-[1.0625rem] mr-7">{product.technique}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="nota">Medidas</dt>
                <dd className="text-right font-display text-[1.0625rem] tabular">{formatDimensions(product.widthCm, product.heightCm)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 pt-4">
                <dt className="nota">Precio</dt>
                <dd className={`text-right font-display text-[1.75rem] leading-none tabular ${vendido ? 'line-through text-ink-soft' : 'text-ink'}`}>
                  {formatPrice(product.priceCents, product.currency)}
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-8 text-ink-soft leading-relaxed max-w-[60ch]">{product.description}</p>

          <div className="mt-10">
            <WhatsAppButton product={product} className="w-full sm:w-auto" />
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Se abre WhatsApp con el nombre del cuadro ya escrito. Tú solo envías.
          </p>
        </Reveal>
      </div>
    </article>
  )
}
