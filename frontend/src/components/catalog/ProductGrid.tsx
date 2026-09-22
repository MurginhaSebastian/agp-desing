import { ProductCard } from '@/components/catalog/ProductCard'
import { Reveal } from '@/components/ui/Reveal'
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

export function ProductGrid({ products, columns = 3 }: Props) {
  const offsets = columns === 3 ? offsets3 : offsets2
  const cols = columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'

  return (
    <ul className={`grid grid-cols-1 ${cols} gap-x-10 gap-y-16 lg:gap-x-14`}>
      {products.map((p, i) => (
        <Reveal
          as="li"
          key={p.id}
          delay={(i % columns) * 60}
          className={i < columns ? offsets[i % columns] : ''}
        >
          <ProductCard product={p} index={i} />
        </Reveal>
      ))}
    </ul>
  )
}
