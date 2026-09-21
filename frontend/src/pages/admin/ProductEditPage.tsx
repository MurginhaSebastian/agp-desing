import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from '@/components/admin/ProductForm'
import { productService } from '@/services/productService'
import type { Product, ProductCreateDTO } from '@/types/product'

/** Una sola página para crear (/admin/cuadros/nuevo) y editar (/admin/cuadros/:id). */
export function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [product, setProduct] = useState<Product | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>(isNew ? 'ok' : 'loading')

  useEffect(() => {
    if (!id) return
    let alive = true
    productService
      .getById(id)
      .then((p) => {
        if (!alive) return
        setProduct(p)
        setState('ok')
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
    }
  }, [id])

  async function save(dto: ProductCreateDTO) {
    if (isNew) await productService.create(dto)
    else await productService.update(id, dto)
    navigate('/admin')
  }

  if (state === 'loading') return <p className="label" role="status">Cargando…</p>
  if (state === 'missing') {
    return (
      <div>
        <p className="font-display text-2xl">Ese cuadro no existe.</p>
        <Link to="/admin" className="btn-secondary mt-6"><ArrowLeft size={18} aria-hidden="true" /> Volver</Link>
      </div>
    )
  }

  const initial: ProductCreateDTO | undefined = product
    ? {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        currency: product.currency,
        widthCm: product.widthCm,
        heightCm: product.heightCm,
        technique: product.technique,
        imageUrl: product.imageUrl,
        status: product.status,
        featured: product.featured,
      }
    : undefined

  return (
    <>
      <Link to="/admin" className="btn-ghost -ml-3 mb-6">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Cuadros
      </Link>
      <p className="label-brand">{isNew ? 'Nuevo' : 'Editar'}</p>
      <h1 className="text-h2 mt-2 mb-10">{isNew ? 'Colgar un cuadro' : product?.name}</h1>
      <ProductForm key={product?.id ?? 'new'} initial={initial} submitLabel={isNew ? 'Publicar en el catálogo' : 'Guardar cambios'} onSubmit={save} />
    </>
  )
}
