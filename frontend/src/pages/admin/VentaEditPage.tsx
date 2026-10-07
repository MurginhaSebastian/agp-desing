import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { VentaForm } from '@/components/admin/VentaForm'
import { useProducts } from '@/hooks/useProducts'
import { useRecurso } from '@/hooks/useRecurso'
import { aDtoDeProducto } from '@/lib/productos'
import { productService, ventasService } from '@/services/servicios'
import type { Product } from '@/types/product'
import type { SaleInput } from '@/types/sale'

/**
 * Una sola página para registrar (/admin/ventas/nueva) y editar (/admin/ventas/:id) una venta.
 * Desde la lista de productos se llega con `?obra=<id>` y la obra ya elegida.
 */
export function VentaEditPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isNew = !id
  const { dato: venta, estado } = useRecurso(id ?? null, ventasService.get)
  const { products, loading: cargandoObras } = useProducts()

  async function save(input: SaleInput, { liberarObra }: { liberarObra: Product | null }) {
    if (isNew) await ventasService.create(input)
    else await ventasService.update(id, input)
    if (liberarObra) await productService.update(liberarObra.id, { ...aDtoDeProducto(liberarObra), status: 'AVAILABLE' })
    navigate('/admin/ventas')
  }

  if (estado === 'loading' || (cargandoObras && products.length === 0)) return <p className="label" role="status">Cargando…</p>
  if (estado === 'missing') {
    return (
      <div>
        <p className="font-display text-2xl">Esa venta no existe.</p>
        <Link to="/admin/ventas" className="btn-secondary mt-6"><ArrowLeft size={18} aria-hidden="true" /> Volver</Link>
      </div>
    )
  }

  return (
    <>
      <Link to="/admin/ventas" className="btn-ghost -ml-3 mb-6">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Ventas
      </Link>
      <p className="label-brand">{isNew ? 'Nueva' : 'Editar'}</p>
      <h1 className="text-h2 mt-2 mb-10">{isNew ? 'Registrar una venta' : venta?.item}</h1>
      <VentaForm
        key={venta?.id ?? 'nueva'}
        venta={venta ?? undefined}
        obras={products}
        obraInicial={params.get('obra')}
        submitLabel={isNew ? 'Guardar la venta' : 'Guardar cambios'}
        onSubmit={save}
      />
    </>
  )
}
