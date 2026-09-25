import { useState } from 'react'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { Reveal } from '@/components/ui/Reveal'
import { useProducts } from '@/hooks/useProducts'
import type { ProductStatus } from '@/types/product'

type Filter = 'ALL' | ProductStatus

const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todo' },
  { value: 'AVAILABLE', label: 'Disponibles' },
  { value: 'COMMISSION', label: 'Por encargo' },
  { value: 'SOLD', label: 'Vendidos' },
]

export function CatalogPage() {
  const { products, loading, error, reload } = useProducts()
  const [filter, setFilter] = useState<Filter>('ALL')
  const visible = filter === 'ALL' ? products : products.filter((p) => p.status === filter)

  return (
    <div className="container-x pt-12 pb-24 md:pt-20 md:pb-32">
      <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="label-brand">Catálogo</p>
          <h1 className="text-display mt-4">El Catálogo.</h1>
          <p className="text-lead mt-6 max-w-[40ch] text-ink-soft">
            Explora nuestras piezas o inspírate para crear la tuya desde cero.
          </p>
        </div>

        <div className="lg:col-span-5 lg:justify-self-end" role="group" aria-label="Filtrar por estado">
          <ul className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = filter === f.value
              return (
                <li key={f.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(f.value)}
                    className={`btn min-h-11 px-4 text-sm border ${active ? 'bg-ink text-silk border-ink' : 'bg-transparent text-ink border-oat hover:border-ink'}`}
                  >
                    {f.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </Reveal>

      <div className="mt-14 lg:mt-20 border-t border-ink pt-12 lg:pt-16">
        {loading && <p className="label" role="status">Cargando diseños…</p>}
        {error && (
          <div role="alert" className="max-w-md">
            <p className="font-display text-2xl">No pudimos cargar el catálogo.</p>
            <p className="mt-2 text-ink-soft">{error}</p>
            <button type="button" onClick={() => void reload()} className="btn-secondary mt-6">
              Intentar de nuevo
            </button>
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="font-display text-2xl text-ink-soft">
            Nada en esta categoría por ahora. Prueba con otra o escríbenos.
          </p>
        )}
        {!loading && !error && visible.length > 0 && <ProductGrid products={visible} columns={3} />}
      </div>
    </div>
  )
}
