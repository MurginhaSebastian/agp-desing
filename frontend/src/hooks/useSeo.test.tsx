import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { resumen, useSeo } from '@/hooks/useSeo'

const DEFECTO =
  'Cuadros 3D y boxes temáticos a medida, para regalar o para la oficina. Hechos a mano en Trujillo; cotiza por WhatsApp.'
const descripcion = () => document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content
const robots = () => document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
const canonica = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
const bloques = () => document.head.querySelectorAll('script[type="application/ld+json"]')

describe('useSeo', () => {
  afterEach(() => {
    cleanup()
    document.head.innerHTML = ''
  })

  it('sin argumentos: descripción por defecto, canónica y sin noindex', () => {
    renderHook(() => useSeo())
    expect(descripcion()).toBe(DEFECTO)
    expect(canonica()?.href).toBe(window.location.origin + window.location.pathname)
    expect(robots()).toBeNull()
    expect(bloques()).toHaveLength(0)
  })

  it('pone la descripción propia y al salir vuelve a la de siempre', () => {
    const { unmount } = renderHook(() => useSeo({ description: 'Una obra' }))
    expect(descripcion()).toBe('Una obra')
    unmount()
    expect(descripcion()).toBe(DEFECTO)
  })

  it('una descripción vacía cae a la por defecto', () => {
    renderHook(() => useSeo({ description: '' }))
    expect(descripcion()).toBe(DEFECTO)
  })

  it('reutiliza la meta description que ya trae index.html', () => {
    document.head.innerHTML = '<meta name="description" content="vieja">'
    renderHook(() => useSeo({ description: 'nueva' }))
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(descripcion()).toBe('nueva')
  })

  it('noindex añade robots y se quita al salir', () => {
    const { unmount } = renderHook(() => useSeo({ noindex: true }))
    expect(robots()?.content).toBe('noindex')
    unmount()
    expect(robots()).toBeNull()
  })

  it('jsonLd añade un bloque de datos y se quita al salir', () => {
    const { unmount } = renderHook(() => useSeo({ jsonLd: { '@type': 'Product', name: 'Luna' } }))
    expect(bloques()).toHaveLength(1)
    expect(JSON.parse(bloques()[0].textContent ?? '')).toEqual({ '@type': 'Product', name: 'Luna' })
    unmount()
    expect(bloques()).toHaveLength(0)
  })

  it('con un jsonLd de igual contenido en otro objeto no duplica el bloque', () => {
    const { rerender } = renderHook(({ d }) => useSeo({ jsonLd: d }), { initialProps: { d: { a: 1 } } })
    rerender({ d: { a: 1 } })
    expect(bloques()).toHaveLength(1)
  })

  it('al cambiar el jsonLd reemplaza el bloque', () => {
    const { rerender } = renderHook(({ d }) => useSeo({ jsonLd: d }), { initialProps: { d: { a: 1 } } })
    rerender({ d: { a: 2 } })
    expect(bloques()).toHaveLength(1)
    expect(bloques()[0].textContent).toBe('{"a":2}')
  })
})

describe('resumen', () => {
  it('deja intacto un texto corto y junta espacios y saltos', () => {
    expect(resumen('  hola \n  mundo ')).toBe('hola mundo')
  })

  it('recorta en el último espacio antes del límite y añade …', () => {
    const r = resumen('uno dos tres cuatro', 10)
    expect(r).toBe('uno dos…')
    expect(r.length).toBeLessThanOrEqual(10)
  })

  it('una sola palabra larga se corta en seco', () => {
    expect(resumen('abcdefghijklmnop', 5)).toBe('abcd…')
  })

  it('justo en el límite no recorta', () => {
    expect(resumen('12345', 5)).toBe('12345')
  })
})
