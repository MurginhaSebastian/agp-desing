import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'

afterEach(cleanup)

const obra = { name: 'Atardecer', slug: 'atardecer', status: 'AVAILABLE' as const }

describe('WhatsAppButton', () => {
  it('sin obra, abre wa.me con el mensaje genérico', () => {
    render(<WhatsAppButton />)
    const a = screen.getByRole('link', { name: 'Cotizar por WhatsApp' })
    const url = new URL(a.getAttribute('href')!)
    expect(url.origin + url.pathname).toBe('https://wa.me/51999999999')
    expect(url.searchParams.get('text')).toContain('cotizar un diseño personalizado')
  })

  it('con obra, el mensaje lleva su nombre y la dirección de su ficha', () => {
    render(<WhatsAppButton product={obra} />)
    const a = screen.getByRole('link', { name: 'Cotizar esta pieza' })
    const texto = new URL(a.getAttribute('href')!).searchParams.get('text')!
    expect(texto).toContain('«Atardecer»')
    expect(texto).toContain(`${window.location.origin}/catalogo/atardecer`)
  })

  it('una obra vendida ofrece pedir una similar', () => {
    render(<WhatsAppButton product={{ ...obra, status: 'SOLD' }} />)
    expect(screen.getByRole('link', { name: 'Pedir uno similar' })).toBeTruthy()
  })

  it('abre en pestaña nueva con noopener en las tres variantes', () => {
    for (const variant of ['primary', 'secondary', 'on-dark'] as const) {
      const { unmount } = render(<WhatsAppButton variant={variant} />)
      const a = screen.getByRole('link')
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toContain('noopener')
      unmount()
    }
  })
})
