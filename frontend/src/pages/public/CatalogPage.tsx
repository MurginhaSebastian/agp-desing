import { useState } from 'react'
import { EsqueletoObras } from '@/components/catalog/EsqueletoObras'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
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

/**
 * El catálogo es una carpeta: los filtros son las pestañas de sus separadores y la pared de
 * obras va en la hoja de delante. Cambiar de filtro es sacar otra hoja al frente.
 */
export function CatalogPage() {
  const { products, loading, error, reload } = useProducts()
  const [filter, setFilter] = useState<Filter>('ALL')
  const visible = filter === 'ALL' ? products : products.filter((p) => p.status === filter)

  return (
    <div className="container-x pt-12 pb-24 md:pt-20 md:pb-32">
      <Reveal>
        <h1 className="text-display">El Catálogo.</h1>
        <p className="text-lead mt-6 max-w-[40ch] text-ink-soft">
          Explora nuestras piezas o inspírate para crear la tuya desde cero.
        </p>
      </Reveal>

      <div className="mt-14 lg:mt-20">
        {/*
          Las pestañas se pegan al borde de la hoja. En móvil no caben las cuatro: la fila llega
          hasta el borde de la pantalla y se desplaza de lado. Las de detrás bajan 4 px y la fila
          las recorta ahí, así parecen metidas bajo la hoja.
        */}
        <div role="group" aria-label="Filtrar por estado" className="-mx-gutter px-gutter sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:none]">
          <ul className="flex gap-1 pl-4 sm:pl-8 md:pl-12 w-max">
            {filters.map((f) => (
              <li key={f.value}>
                <button type="button" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)} className="separador">
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="hoja-catalogo paspartu capa-2 relative px-4 pt-10 pb-14 sm:px-8 md:px-12 md:pt-14 md:pb-20">
          {/* Cada pieza es un h3; sin este h2 el salto desde el h1 rompe el orden de títulos. */}
          <h2 className="sr-only">Piezas del catálogo</h2>
          {loading && <EsqueletoObras cuantas={3} columns={3} />}
          {error && (
            <div role="alert" className="max-w-md">
              <p className="font-display text-2xl">No pudimos cargar el catálogo.</p>
              <p className="mt-2 text-ink-soft">{error}</p>
              <button type="button" onClick={() => void reload()} className="boton mt-6">
                Intentar de nuevo
              </button>
            </div>
          )}
          {!loading && !error && visible.length === 0 && (
            /* Estado vacío: una caja sin pieza dentro, y la salida a mano. */
            <div className="grid gap-8 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center sm:gap-12">
              <div aria-hidden="true" className="mat capa-1 p-5 max-w-[14rem]">
                <div className="aspect-[4/5] border border-dashed border-greige" />
              </div>
              <div>
                <p className="font-display text-2xl text-ink-soft max-w-[26ch]">
                  Nada en esta categoría por ahora. Prueba con otra o escríbenos.
                </p>
                <div className="mt-4">
                  <WhatsAppButton variant="secondary" />
                </div>
              </div>
            </div>
          )}
          {!loading && !error && visible.length > 0 && <ProductGrid products={visible} columns={3} />}
        </div>
      </div>
    </div>
  )
}
