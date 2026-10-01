import { Suspense, useEffect, useLayoutEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ScrollManager } from '@/components/layout/ScrollManager'
import { escucharClics } from '@/lib/sonido'

/** Lo que se ve el instante que tarda en llegar una página cargada aparte (panel). */
export function Cargando() {
  return (
    <div className="container-x py-24">
      <p className="label" role="status">Cargando…</p>
    </div>
  )
}

/**
 * Lo mismo en la web (páginas legales). Ocupa la pantalla entera para que el pie no se vea
 * arriba y salte hacia abajo al llegar la página: ese salto era casi todo el CLS de las legales.
 */
function CargandoPagina() {
  return (
    <div className="container-x py-24 min-h-svh">
      <p className="nota" role="status">Cargando…</p>
    </div>
  )
}

export function PublicLayout() {
  // El pop suena solo en la web pública: en el panel, con formularios, sería ruido.
  useEffect(escucharClics, [])

  /*
   * El sistema «Capas» (index.css) solo existe dentro de `.sitio`. Va en <html> y no en un
   * envoltorio porque el menú móvil y el visor de fotos se pintan en un portal, fuera del
   * árbol de la página, y también tienen que llevarlo. Antes del primer pintado, para que no
   * se vea ni un instante la tipografía del panel.
   */
  useLayoutEffect(() => {
    document.documentElement.classList.add('sitio')
    return () => document.documentElement.classList.remove('sitio')
  }, [])

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 boton">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Suspense fallback={<CargandoPagina />}>
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
