import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductGrid } from '@/components/catalog/ProductGrid'
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
      <Hero />

      {/* Selección del catálogo — la pared de galería es lo primero que se ve tras el titular */}
      <section aria-labelledby="seleccion-title" className="container-x pb-24 md:pb-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-6 border-t border-ink pt-6">
          <div>
            <p className="label-brand">Del catálogo</p>
            <h2 id="seleccion-title" className="text-h2 mt-3">Nuestros diseños</h2>
          </div>
          <Link to="/catalogo" className="btn-ghost -mr-3">
            Ver todo el catálogo
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </Reveal>

        <div className="mt-12 lg:mt-16">
          {loading ? (
            <p className="label" role="status">Cargando diseños…</p>
          ) : (
            <ProductGrid products={featured} columns={2} />
          )}
        </div>
      </section>

      <About />
      <HowItWorks />
      <Faq />
      <Contact />
    </>
  )
}
