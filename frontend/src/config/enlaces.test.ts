import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { REDES, SECCIONES } from '@/config/enlaces'

describe('enlaces', () => {
  it('el catálogo es una ruta propia y las demás secciones son anclas de la portada', () => {
    const catalogo = SECCIONES.find((s) => s.to === '/catalogo')
    expect(catalogo?.label).toBe('Catálogo')
    for (const s of SECCIONES) {
      if (s.to !== '/catalogo') expect(s.to.startsWith('/#')).toBe(true)
    }
  })

  it('Contacto no se repite en el pie; el resto sí', () => {
    const contacto = SECCIONES.find((s) => s.label === 'Contacto')
    expect(contacto?.enPie).toBe(false)
    expect(SECCIONES.filter((s) => s.enPie).map((s) => s.label)).toEqual([
      'Sobre AGP',
      'Cómo funciona',
      'Catálogo',
      'Preguntas frecuentes',
    ])
  })

  it('las redes toman su URL del entorno', () => {
    expect(REDES.map((r) => r.nombre)).toEqual(['Instagram', 'TikTok'])
    expect(REDES.find((r) => r.nombre === 'Instagram')?.url).toBe(env.instagramUrl)
    expect(REDES.find((r) => r.nombre === 'TikTok')?.url).toBe(env.tiktokUrl)
  })
})
