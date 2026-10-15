import { Link } from 'react-router-dom'
import { env } from '@/config/env'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { EsqueletoObras } from '@/components/catalog/EsqueletoObras'
import { FlechaDerecha } from '@/components/ui/iconos'
import { Reveal } from '@/components/ui/Reveal'
import { useProducts } from '@/hooks/useProducts'
import { useSeo } from '@/hooks/useSeo'
import { About } from '@/pages/public/sections/About'
import { Contact } from '@/pages/public/sections/Contact'
import { Faq } from '@/pages/public/sections/Faq'
import { Hero } from '@/pages/public/sections/Hero'
import { HowItWorks } from '@/pages/public/sections/HowItWorks'

/** Datos del negocio para Google. Los contactos de ejemplo de env.ts no se anuncian. */
function datosDelNegocio() {
  const redes = [env.instagramUrl, env.tiktokUrl].filter((u) => !/\/@?ejemplo\/?$/.test(u))
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: env.brandName,
    url: window.location.origin,
    description: 'Cuadros 3D y boxes temáticos a medida, hechos a mano. Cotización por WhatsApp.',
    address: { '@type': 'PostalAddress', addressLocality: 'Trujillo', addressRegion: 'La Libertad', addressCountry: 'PE' },
    ...(redes.length ? { sameAs: redes } : {}),
    ...(env.whatsappNumber !== '51999999999'
      ? { contactPoint: { '@type': 'ContactPoint', telephone: `+${env.whatsappNumber}`, contactType: 'sales', availableLanguage: 'es' } }
      : {}),
  }
}

export function HomePage() {
  const { products, loading } = useProducts()
  useSeo({ jsonLd: datosDelNegocio() })
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
