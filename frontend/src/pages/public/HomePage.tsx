import { Link } from 'react-router-dom'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { EsqueletoObras } from '@/components/catalog/EsqueletoObras'
import { FlechaDerecha } from '@/components/ui/iconos'
import { Reveal } from '@/components/ui/Reveal'
import { useProducts } from '@/hooks/useProducts'
import { About } from '@/pages/public/sections/About'
import { Contact } from '@/pages/public/sections/Contact'
import { Faq } from '@/pages/public/sections/Faq'
import { Hero } from '@/pages/public/sections/Hero'
import { HowItWorks } from '@/pages/public/sections/HowItWorks'

export function HomePage() {
  const { products, loading } = useProducts()
  const featured = products.filter((p) => p.featured).slice(0, 4)

  return (
    <>
      <Hero obras={products} cargando={loading} />

      {/* Selección del catálogo: la pared de obras montadas es lo primero que se ve tras la portada. */}
      <section aria-labelledby="seleccion-title" className="container-x pb-28 md:pb-40">
        <Reveal className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4">
          <h2 id="seleccion-title" className="text-h2">Nuestros diseños</h2>
          <Link to="/catalogo" className="enlace-flecha">
            Ver todo el catálogo
            <FlechaDerecha size={18} />
          </Link>
        </Reveal>

        <div className="mt-12 lg:mt-16">
          {loading ? <EsqueletoObras cuantas={2} columns={2} /> : <ProductGrid products={featured} columns={2} />}
        </div>
      </section>

      <About />
      <HowItWorks />
      <Faq />
      <Contact />
    </>
  )
}
