interface Props {
  cuantas: number
  columns?: 2 | 3
}

/* Proporciones variadas, como las fotos de verdad: la pared no sale como una cuadrícula uniforme. */
const PROPORCIONES = ['4 / 5', '5 / 4', '3 / 4', '1 / 1', '4 / 5', '3 / 4']

/**
 * Lo que se ve mientras llegan las obras: la forma de la pared, no un texto suelto.
 * Mismas columnas y desplazamientos que ProductGrid, para que al llegar no salte nada.
 * El aviso «Cargando diseños…» sigue ahí, solo para lectores de pantalla.
 */
export function EsqueletoObras({ cuantas, columns = 3 }: Props) {
  const cols = columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
  const desplazamiento = columns === 3 ? ['', 'md:mt-12 lg:mt-16', 'lg:mt-8'] : ['', 'md:mt-20']

  return (
    <div>
      <p className="sr-only" role="status">Cargando diseños…</p>
      <ul aria-hidden="true" className={`grid grid-cols-1 ${cols} gap-x-10 gap-y-16 lg:gap-x-14`}>
        {Array.from({ length: cuantas }, (_, i) => (
          <li key={i} className={i < columns ? desplazamiento[i % columns] : ''}>
            <div className="mat p-[5%] pb-10 capa-1">
              <div className="esqueleto" style={{ aspectRatio: PROPORCIONES[i % PROPORCIONES.length] }} />
            </div>
            <div className="mt-5 space-y-2.5">
              <div className="esqueleto h-5 w-3/5" />
              <div className="esqueleto h-3.5 w-2/5" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
