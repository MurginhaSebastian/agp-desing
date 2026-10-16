import { describe, expect, it } from 'vitest'
import { buildWhatsAppUrl, enlaceWhatsApp } from '@/lib/whatsapp'

describe('buildWhatsAppUrl', () => {
  it('sin obra, pide cotizar un diseño personalizado', () => {
    const url = new URL(buildWhatsAppUrl())
    expect(url.origin + url.pathname).toBe('https://wa.me/51999999999')
    expect(url.searchParams.get('text')).toBe('¡Hola! Estuve viendo su catálogo en la web y me gustaría cotizar un diseño personalizado.')
  })

  it('con obra, la nombra entre comillas latinas y enlaza su ficha', () => {
    const url = new URL(buildWhatsAppUrl({ name: 'Tarde & noche', slug: 'tarde-noche' }))
    expect(url.searchParams.get('text')).toBe(
      `¡Hola! Vi el diseño «Tarde & noche» en su web y me encantó. ¿Podrían darme información para personalizar uno?\n${window.location.origin}/catalogo/tarde-noche`,
    )
  })
})

describe('enlaceWhatsApp', () => {
  it('abre el chat sin mensaje', () => {
    expect(enlaceWhatsApp()).toBe('https://wa.me/51999999999')
  })
})
