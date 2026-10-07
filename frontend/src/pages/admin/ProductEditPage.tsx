import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from '@/components/admin/ProductForm'
import { useRecurso } from '@/hooks/useRecurso'
import { aDtoDeProducto } from '@/lib/productos'
import { productService } from '@/services/servicios'
import type { ProductCreateDTO } from '@/types/product'

/** Una sola página para crear (/admin/cuadros/nuevo) y editar (/admin/cuadros/:id). */
export function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const { dato: product, estado: state } = useRecurso(id ?? null, productService.getById)

  async function save(dto: ProductCreateDTO) {
    if (isNew) await productService.create(dto)
    else await productService.update(id, dto)
    navigate('/admin')
  }

  if (state === 'loading') return <p className="label" role="status">Cargando…</p>
  if (state === 'missing') {
    return (
      <div>
        <p className="font-display text-2xl">Ese producto no existe.</p>
        <Link to="/admin" className="btn-secondary mt-6"><ArrowLeft size={18} aria-hidden="true" /> Volver</Link>
      </div>
    )
  }

  const initial: ProductCreateDTO | undefined = product ? aDtoDeProducto(product) : undefined

  return (
    <>
      <Link to="/admin" className="btn-ghost -ml-3 mb-6">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Productos
      </Link>
      <p className="label-brand">{isNew ? 'Nuevo' : 'Editar'}</p>
      <h1 className="text-h2 mt-2 mb-10">{isNew ? 'Añadir un producto' : product?.name}</h1>
      <ProductForm key={product?.id ?? 'new'} initial={initial} submitLabel={isNew ? 'Publicar en el catálogo' : 'Guardar cambios'} onSubmit={save} />
    </>
  )
}
