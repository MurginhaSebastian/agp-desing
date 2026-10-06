import { describe, expect, it } from 'vitest'
import { buildWhatsAppUrl, enlaceWhatsApp } from '@/lib/whatsapp'

describe('buildWhatsAppUrl', () => {
  it('sin obra, pide cotizar un diseño', () => {
    const url = new URL(buildWhatsAppUrl())
    expect(url.origin + url.pathname).toBe('https://wa.me/51999999999')
    expect(url.searchParams.get('text')).toBe('Hola, vengo de la web. Quiero cotizar un diseño.')
  })

  it('con obra, la nombra entre comillas latinas', () => {
    const url = new URL(buildWhatsAppUrl({ name: 'Tarde & noche' }))
    expect(url.searchParams.get('text')).toBe('Hola, vengo de la web. Me interesa cotizar «Tarde & noche».')
  })
})

describe('enlaceWhatsApp', () => {
  it('abre el chat sin mensaje', () => {
    expect(enlaceWhatsApp()).toBe('https://wa.me/51999999999')
  })
})
