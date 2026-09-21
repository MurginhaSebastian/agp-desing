import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { Reveal } from '@/components/ui/Reveal'
import { formatDimensions, formatPrice } from '@/lib/format'
import { productService } from '@/services/productService'
import { PRODUCT_STATUS_LABEL, type Product } from '@/types/product'

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    productService
      .getBySlug(slug)
      .then((p) => {
        if (!alive) return
        setProduct(p)
        setState('ok')
        document.title = `${p.name} — AGP Desing`
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
      document.title = 'AGP Desing — Cuadros hechos a mano'
    }
  }, [slug])

  if (state === 'loading') {
    return (
      <div className="container-x py-24">
        <p className="label" role="status">Cargando obra…</p>
      </div>
    )
  }

  if (state === 'missing' || !product) {
    return (
      <div className="container-x py-24 max-w-xl">
        <p className="label-brand">404</p>
        <h1 className="text-h2 mt-4">Ese cuadro no está en la pared.</h1>
        <p className="mt-4 text-ink-soft">Puede que se haya vendido o que el enlace esté mal escrito.</p>
        <Link to="/catalogo" className="btn-secondary mt-8">
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Volver al catálogo
        </Link>
      </div>
    )
  }

  const ratio = product.widthCm / product.heightCm

  return (
    <article className="container-x pt-8 pb-24 md:pt-12 md:pb-32">
      <Link to="/catalogo" className="btn-ghost -ml-3 mb-8">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Catálogo
      </Link>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal as="figure" className="lg:col-span-7 bg-nude" >
          <div style={{ aspectRatio: String(ratio) }} className="w-full">
            <img
              src={product.imageUrl}
              alt={`${product.name} — ${product.technique}, ${formatDimensions(product.widthCm, product.heightCm)}`}
              width={product.widthCm * 10}
              height={product.heightCm * 10}
              className="size-full object-cover"
              fetchPriority="high"
            />
          </div>
        </Reveal>

        {/* Ficha: la etiqueta de museo a tamaño completo, pegada al scroll en escritorio */}
        <Reveal delay={80} className="lg:col-span-4 lg:col-start-9 lg:sticky lg:top-28 lg:self-start">
          <p className="label-brand">{PRODUCT_STATUS_LABEL[product.status]}</p>
          <h1 className="text-h2 mt-4">{product.name}</h1>

          <dl className="mt-8 border-t border-ink">
            <div className="flex justify-between gap-6 py-3 border-b border-oat">
              <dt className="label">Técnica</dt>
              <dd className="text-right">{product.technique}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3 border-b border-oat">
              <dt className="label">Medidas</dt>
              <dd className="text-right tabular">{formatDimensions(product.widthCm, product.heightCm)}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3 border-b border-oat">
              <dt className="label">Precio</dt>
              <dd className={`text-right tabular font-semibold ${product.status === 'SOLD' ? 'line-through text-greige' : ''}`}>
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
