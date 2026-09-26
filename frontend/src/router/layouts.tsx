import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ScrollManager } from '@/components/layout/ScrollManager'

/** Lo que se ve el instante que tarda en llegar una página cargada aparte. */
export function Cargando() {
  return (
    <div className="container-x py-24">
      <p className="label" role="status">Cargando…</p>
    </div>
  )
}

export function PublicLayout() {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn-primary">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Suspense fallback={<Cargando />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

export function Root() {
  return (
    <>
      <ScrollManager />
      <Outlet />
    </>
  )
}

/** El panel entero va detrás de su propia espera. */
export function AdminSuspense() {
  return (
    <Suspense fallback={<Cargando />}>
      <Outlet />
    </Suspense>
  )
}
