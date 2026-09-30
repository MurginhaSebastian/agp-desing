import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ProductCard } from '@/components/catalog/ProductCard'
import type { Product } from '@/types/product'

interface Props {
  products: Product[]
  /** cuántas columnas en escritorio; la portada usa 2, el catálogo 3 */
  columns?: 2 | 3
}

/*
 * Pared de galería: los cuadros cuelgan a alturas distintas. En escritorio
 * cada columna arranca con un desplazamiento diferente (0 / 4rem / 2rem),
 * así la cuadrícula no parece una tabla. En tablet, donde son dos columnas,
 * solo se desplaza la segunda. En móvil es una sola columna.
 */
const offsets3 = ['lg:mt-0', 'md:mt-12 lg:mt-16', 'lg:mt-8']
const offsets2 = ['md:mt-0', 'md:mt-20']

/* Curvas del proyecto (`--ease-out` y `--ease-in-out` de index.css), en el formato de Motion. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

/* Misma lista de funciones en todos los estados, para que Motion pueda interpolar entre ellos. */
const REPOSO = 'translateY(0px) scale(1)'

export function ProductGrid({ products, columns = 3 }: Props) {
  const offsets = columns === 3 ? offsets3 : offsets2
  const cols = columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
  const reduce = useReducedMotion()

  // Pasa a `true` después del primer montaje. Lo que aparezca a partir de ahí entra por un filtro.
  const montada = useRef(false)
  useEffect(() => {
    montada.current = true
  }, [])

  return (
    <ul className={`relative grid grid-cols-1 ${cols} gap-x-10 gap-y-16 lg:gap-x-14`}>
      {/*
        Al filtrar, las piezas que salen se desvanecen y las que quedan se recolocan en su
        nuevo sitio en vez de saltar. `popLayout` saca de la cuadrícula a las que se van, para
        que las demás empiecen a moverse sin esperar a que terminen de irse.
      */}
      <AnimatePresence mode="popLayout">
        {products.map((p, i) => (
          <motion.li
            key={p.id}
            /*
             * Solo la posición: con `layout` a secas, Motion también escala la caja para acompañar
             * un cambio de tamaño, y con fotos de proporciones distintas las deformaría a mitad del
             * movimiento. Con reduced-motion se recolocan sin viajar.
             */
            layout={reduce ? false : 'position'}
            className={i < columns ? offsets[i % columns] : ''}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_OUT } }}
            transition={{ layout: { duration: 0.25, ease: EASE_IN_OUT } }}
          >
            <Pieza montada={montada} retraso={((i % columns) * 60) / 1000} reduce={reduce === true}>
              <ProductCard product={p} index={i} />
            </Pieza>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

interface PiezaProps {
  montada: RefObject<boolean>
  retraso: number
  reduce: boolean
  children: ReactNode
}

/**
 * La entrada de cada pieza. Se decide UNA vez, al aparecer:
 *  - si estaba desde el primer montaje, se revela al llegar con el scroll, como el resto de la
 *    web (600 ms, escalonada por columna);
 *  - si aparece después, es que entró por un filtro, y lo hace al momento y rápido (200 ms):
 *    quien pulsa un filtro está esperando el resultado, no una presentación.
 * Decidirlo al aparecer, y no en cada render, importa: el catálogo se refresca por detrás al
 * llegar la lista del servidor, y ese segundo montaje no debe cambiar cómo entran las piezas
 * que todavía no se han visto.
 */
function Pieza({ montada, retraso, reduce, children }: PiezaProps) {
  const [porFiltro] = useState(() => montada.current === true)

  if (porFiltro) {
    return (
      <motion.div
        initial={{ opacity: 0, transform: reduce ? REPOSO : 'translateY(0px) scale(0.97)' }}
        animate={{ opacity: 1, transform: REPOSO }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, transform: reduce ? REPOSO : 'translateY(18px) scale(1)' }}
      whileInView={{ opacity: 1, transform: REPOSO }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduce ? 0.25 : 0.6, ease: EASE_OUT, delay: retraso }}
    >
      {children}
    </motion.div>
  )
}
