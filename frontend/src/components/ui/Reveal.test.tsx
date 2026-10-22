import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Reveal } from '@/components/ui/Reveal'

/* jsdom no trae IntersectionObserver: se finge que el elemento ya está a la vista. */
class Visible {
  cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }
  observe(el: Element) {
    this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => vi.stubGlobal('IntersectionObserver', Visible))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Reveal', () => {
  it('pinta los hijos', () => {
    render(<Reveal>Hola taller</Reveal>)
    expect(screen.getByText('Hola taller')).toBeTruthy()
  })

  it('usa la etiqueta que se le pide', () => {
    render(
      <Reveal as="li" className="obra">
        Obra
      </Reveal>,
    )
    const el = screen.getByText('Obra')
    expect(el.tagName).toBe('LI')
    expect(el.className).toContain('obra')
  })
})
