import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { Footer } from '@/components/layout/Footer'
import { env } from '@/config/env'

afterEach(cleanup)

function montar() {
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  it('lista las secciones del pie, sin Contacto', () => {
    montar()
    const pie = screen.getByRole('navigation', { name: 'Pie de página' })
    expect(pie.textContent).toContain('Sobre AGP')
    expect(pie.textContent).toContain('Catálogo')
    expect(pie.textContent).not.toContain('Contacto')
  })

  it('enlaza WhatsApp y las redes del entorno', () => {
    montar()
    expect(screen.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).toContain('wa.me')
    expect(screen.getByRole('link', { name: /Instagram/ }).getAttribute('href')).toBe(env.instagramUrl)
    expect(screen.getByRole('link', { name: /TikTok/ }).getAttribute('href')).toBe(env.tiktokUrl)
  })

  it('tiene los enlaces legales y el panel', () => {
    montar()
    const legal = screen.getByRole('navigation', { name: 'Legal' })
    expect(legal.textContent).toContain('Privacidad')
    expect(legal.textContent).toContain('Términos')
    expect(legal.textContent).toContain('Administrar')
  })
})
