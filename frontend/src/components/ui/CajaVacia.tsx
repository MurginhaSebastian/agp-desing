import type { ReactNode } from 'react'

interface Props {
  titulo: string
  texto: string
  /** Las salidas: enlaces al catálogo, al inicio… */
  children: ReactNode
}

/**
 * Para lo que no está (una página o un diseño que no existe): una caja de sombra sin pieza
 * dentro. El fondo hundido, con la sombra hacia dentro, y el «404» anotado a lápiz en el
 * margen del paspartú, como el número de las obras del catálogo.
 */
export function CajaVacia({ titulo, texto, children }: Props) {
  return (
    <div className="container-x pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-10">
        <div className="md:col-span-5 lg:col-span-4">
          <div className="relative paspartu capa-3 p-5 pb-11 max-w-[17rem] md:max-w-none">
            <div
              aria-hidden="true"
              className="aspect-[4/5] radio-papel bg-oat shadow-[inset_7px_9px_22px_-10px_color-mix(in_oklch,var(--color-bordeaux)_45%,transparent)]"
            />
            <p className="absolute right-5 bottom-2.5 font-display text-[0.9375rem] text-ink-soft tabular">404</p>
          </div>
        </div>

        <div className="md:col-span-7 lg:col-span-6 lg:col-start-6">
          <h1 className="text-h2 max-w-[20ch]">{titulo}</h1>
          <p className="mt-5 text-lead text-ink-soft max-w-[44ch]">{texto}</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
