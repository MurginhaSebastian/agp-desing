import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CarruselPortada } from '@/pages/public/sections/CarruselPortada'

const FOTOS = ['/a.svg', '/b.svg', '/c.svg']

/* jsdom no trae IntersectionObserver: se finge que la caja siempre está a la vista. */
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

function mockMatchMedia(reducir: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reducir && q.includes('prefers-reduced-motion'),
    media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  }))
}

const contador = () => screen.getByText(/\/ 03/).textContent
const avanzar = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

function montar() {
  render(<MemoryRouter><CarruselPortada fotos={FOTOS} cargando={false} /></MemoryRouter>)
}

describe('CarruselPortada', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', Visible)
    mockMatchMedia(false)
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('pasa sola cada 5 s', () => {
    montar()
    expect(contador()).toBe('01 / 03')
    avanzar(4900)
    expect(contador()).toBe('01 / 03')
    avanzar(200)
    expect(contador()).toBe('02 / 03')
    avanzar(5000)
    expect(contador()).toBe('03 / 03')
  })

  it('el botón de pausa la detiene y se puede reanudar', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Pausar las fotos' }))
    avanzar(20000)
    expect(contador()).toBe('01 / 03')
    fireEvent.click(screen.getByRole('button', { name: 'Seguir pasando las fotos' }))
    avanzar(5100)
    expect(contador()).toBe('02 / 03')
  })

  it('se para con el ratón encima y con el foco en los controles', () => {
    montar()
    const caja = screen.getByRole('group', { name: 'Fotos de la portada' }).parentElement!
    fireEvent.pointerEnter(caja, { pointerType: 'mouse' })
    avanzar(10000)
    expect(contador()).toBe('01 / 03')
    fireEvent.pointerLeave(caja, { pointerType: 'mouse' })

    const siguiente = screen.getByRole('button', { name: 'Foto siguiente' })
    fireEvent.focus(siguiente)
    avanzar(10000)
    expect(contador()).toBe('01 / 03')
    fireEvent.blur(siguiente)
    avanzar(5100)
    expect(contador()).toBe('02 / 03')
  })

  it('los botones cambian de foto y dan la vuelta', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Foto anterior' }))
    expect(contador()).toBe('03 / 03')
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }))
    expect(contador()).toBe('01 / 03')
  })

  it('con una sola foto no hay controles', () => {
    render(<MemoryRouter><CarruselPortada fotos={['/a.svg']} cargando={false} /></MemoryRouter>)
    expect(screen.queryByRole('group')).toBeNull()
  })
})
