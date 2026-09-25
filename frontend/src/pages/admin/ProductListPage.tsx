import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '@/hooks/useProducts'
import { formatDimensions, formatPrice } from '@/lib/format'
import { productService } from '@/services/productService'
import { PRODUCT_STATUS_LABEL, type Product } from '@/types/product'

export function ProductListPage() {
  const { products, loading, error, reload } = useProducts()
  const [pending, setPending] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!pending) return
    setDeleting(true)
    try {
      await productService.remove(pending.id)
      setPending(null)
      await reload()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-brand">Catálogo</p>
          <h1 className="text-h2 mt-2">Productos</h1>
        </div>
        <Link to="/admin/cuadros/nuevo" className="btn-primary">
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" /> Añadir un producto
        </Link>
      </div>

      <div className="mt-10">
        {loading && <p className="label" role="status">Cargando…</p>}
        {error && <p role="alert" className="field-error">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <div className="border-t border-ink pt-8 max-w-md">
            <p className="font-display text-2xl">El catálogo está vacío</p>
            <p className="mt-2 text-ink-soft">Añade el primer producto y aparecerá en el catálogo público al instante.</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="overflow-x-auto -mx-[var(--spacing-gutter)] px-[var(--spacing-gutter)]">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-y border-ink text-left">
                  <th scope="col" className="label py-3 pr-4 font-normal sticky left-0 bg-silk">Producto</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Formato</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Medidas</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Precio</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Estado</th>
                  <th scope="col" className="py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-oat">
                    <td className="py-3 pr-4 sticky left-0 bg-silk">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt="" width={40} height={40} className="size-10 object-cover bg-nude" loading="lazy" />
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          {p.featured && <p className="label text-brand mt-0.5">En portada</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{p.technique}</td>
                    <td className="py-3 pr-4 tabular">{formatDimensions(p.widthCm, p.heightCm)}</td>
                    <td className="py-3 pr-4 tabular">{formatPrice(p.priceCents, p.currency)}</td>
                    <td className="py-3 pr-4">{PRODUCT_STATUS_LABEL[p.status]}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/cuadros/${p.id}`} className="btn-ghost size-11 px-0" aria-label={`Editar ${p.name}`}>
                          <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPending(p)}
                          className="btn-ghost size-11 px-0 hover:text-brand"
                          aria-label={`Eliminar ${p.name}`}
                        >
                          <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmación destructiva: inline, sin modal flotante */}
      {pending && (
        <div role="alertdialog" aria-labelledby="del-title" aria-describedby="del-desc" className="fixed inset-x-0 bottom-0 z-50 border-t border-ink bg-silk">
          <div className="container-x py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p id="del-title" className="font-semibold">¿Eliminar «{pending.name}»?</p>
              <p id="del-desc" className="text-sm text-ink-soft">Desaparece del catálogo público. No se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPending(null)} className="btn-secondary" disabled={deleting}>
                Cancelar
              </button>
              <button type="button" onClick={() => void confirmDelete()} className="btn-primary disabled:opacity-50" disabled={deleting} autoFocus>
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
