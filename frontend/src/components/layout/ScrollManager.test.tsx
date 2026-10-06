import { act, cleanup, render } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollManager } from '@/components/layout/ScrollManager'
import { volviendoDe } from '@/lib/navegacion'

/*
 * jsdom no tiene maquetación: aquí `scrollY` se pone a mano para imitar lo que hace el navegador.
 * Lo importante es el orden: al pasar a una página más corta, el navegador recorta el scroll ANTES
 * de que React avise del cambio de ruta.
 */
let y = 0
const moverA = (nueva: number) => {
  y = nueva
  window.dispatchEvent(new Event('scroll'))
}

describe('ScrollManager', () => {
  const scrollTo = vi.fn()
  beforeEach(() => {
    y = 0
    scrollTo.mockReset()
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y })
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => setTimeout(() => f(0), 0))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  function montar() {
    const router = createMemoryRouter(
      [{ element: <><ScrollManager /><Outlet /></>, children: [{ path: '/catalogo', element: null }, { path: '/catalogo/:slug', element: null }] }],
      { initialEntries: ['/catalogo'] },
    )
    render(<RouterProvider router={router} />)
    return router
  }

  it('al volver a la página deja el scroll donde estaba, aunque la ficha fuera más corta', async () => {
    const router = montar()
    await act(async () => moverA(850))

    // La ficha es más corta: el navegador recorta el scroll a 606 en cuanto se pinta.
    await act(async () => {
      y = 606
      await router.navigate('/catalogo/seda-i')
    })
    await act(async () => moverA(0)) // la ficha empieza arriba

    scrollTo.mockClear()
    await act(async () => {
      await router.navigate('/catalogo', { state: volviendoDe('seda-i') })
    })
    expect(scrollTo).toHaveBeenCalledWith({ top: 850, behavior: 'instant' })
  })

  it('con «atrás» también', async () => {
    const router = montar()
    await act(async () => moverA(1200))
    await act(async () => {
      y = 606
      await router.navigate('/catalogo/seda-i')
    })
    await act(async () => moverA(0))
    scrollTo.mockClear()
    await act(async () => {
      await router.navigate(-1)
    })
    expect(scrollTo).toHaveBeenCalledWith({ top: 1200, behavior: 'instant' })
  })

  it('ir a una página nueva empieza arriba', async () => {
    const router = montar()
    await act(async () => moverA(850))
    scrollTo.mockClear()
    await act(async () => {
      await router.navigate('/catalogo/seda-i')
    })
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })
})
