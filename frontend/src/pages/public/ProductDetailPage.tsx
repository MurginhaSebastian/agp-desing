import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { Link, useLocation, useParams } from 'react-router-dom'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
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
    return (
      <div className="container-x py-24">
        <p className="label" role="status">Cargando diseño…</p>
      </div>
    )
  }

  if (state === 'missing' || !product) {
    return (
      <div className="container-x py-24 max-w-xl">
        <p className="label-brand">404</p>
        <h1 className="text-h2 mt-4">Ese diseño aún no existe. ¡Escríbenos para crearlo!</h1>
        <p className="mt-4 text-ink-soft">Puede que ya no esté en el catálogo o que el enlace esté mal escrito.</p>
        <Link to="/catalogo" className="btn-secondary mt-8">
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Volver al catálogo
        </Link>
      </div>
    )
  }


  return (
    <article className="container-x pt-8 pb-24 md:pt-12 md:pb-32">
      {/* Vuelta con la foto viajando a su tarjeta, y el catálogo en la posición en que se dejó. */}
      <Link to="/catalogo" viewTransition state={{ desde: product.slug, volver: true }} className="btn-ghost -ml-3 mb-8">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Catálogo
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

        {/* Ficha: la etiqueta de museo a tamaño completo, pegada al scroll en escritorio */}
        <Reveal delay={80} className="md:col-span-6 lg:col-span-4 lg:col-start-9 lg:sticky lg:top-28 lg:self-start">
          <p className="label-brand">{PRODUCT_STATUS_LABEL[product.status]}</p>
          <h1 className="text-h2 mt-4">{product.name}</h1>

          <dl className="mt-8 border-t border-ink">
            <div className="flex justify-between gap-6 py-3 border-b border-oat">
              <dt className="label">Formato</dt>
              <dd className="text-right">{product.technique}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3 border-b border-oat">
              <dt className="label">Medidas</dt>
              <dd className="text-right tabular">{formatDimensions(product.widthCm, product.heightCm)}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3 border-b border-oat">
              <dt className="label">Precio</dt>
              <dd className={`text-right tabular font-semibold ${product.status === 'SOLD' ? 'line-through text-ink-soft' : ''}`}>
                {formatPrice(product.priceCents, product.currency)}
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-ink-soft leading-relaxed">{product.description}</p>

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
