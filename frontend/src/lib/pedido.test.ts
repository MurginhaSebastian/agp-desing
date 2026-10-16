import { describe, expect, it } from 'vitest'
import { PEDIDO_VACIO, enlaceDePedido, faltan, mensajeDePedido, type Pedido } from '@/lib/pedido'

const ORIGEN = 'https://agp-desing.vercel.app'

describe('mensajeDePedido', () => {
  it('escribe solo lo que se respondió, desde cero y con entrega en Trujillo', () => {
    const p: Pedido = { ...PEDIDO_VACIO, ocasion: 'Aniversario', pieza: 'Cuadro 3D' }
    expect(mensajeDePedido(p, ORIGEN)).toBe(
      [
        'Hola, vengo de la web. Quiero hacer un pedido:',
        '• Ocasión: Aniversario',
        '• Pieza: Cuadro 3D',
        '• Diseño: desde cero',
        '• Entrega: en Trujillo',
        '',
        'Te mando las fotos de referencia por aquí.',
      ].join('\n'),
    )
  })

  it('enlaza la obra de partida, pone la fecha en formato peruano y la ciudad del envío', () => {
    const p: Pedido = {
      ...PEDIDO_VACIO,
      ocasion: 'Fútbol o deporte',
      pieza: 'Cuadro 3D',
      obra: { name: 'Cuadro 3D Fórmula 1', slug: 'cuadro-3d-formula-1' },
      tamano: 'Grande',
      texto: '  Ana   & Luis · 14.02.2020 ',
      entrega: 'provincia',
      ciudad: 'Chiclayo',
      fecha: '2027-02-10',
    }
    const m = mensajeDePedido(p, ORIGEN)
    expect(m).toContain(`• Diseño: a partir de «Cuadro 3D Fórmula 1» ${ORIGEN}/catalogo/cuadro-3d-formula-1`)
    expect(m).toContain('• Tamaño: Grande')
    expect(m).toContain('• Lleva escrito: Ana & Luis · 14.02.2020')
    expect(m).toContain('• Entrega: envío a Chiclayo')
    expect(m).toContain('• Lo necesito para el: 10/02/2027')
  })

  it('un box no lleva tamaño y un envío sin ciudad no se queda en blanco', () => {
    const p: Pedido = { ...PEDIDO_VACIO, ocasion: 'Otra', pieza: 'Box temático', tamano: 'Grande', entrega: 'provincia' }
    const m = mensajeDePedido(p, ORIGEN)
    expect(m).not.toContain('Tamaño')
    expect(m).toContain('• Entrega: envío a otra provincia')
  })
})

describe('faltan', () => {
  it('pide ocasión y pieza, nada más', () => {
    expect(faltan(PEDIDO_VACIO)).toEqual(['ocasion', 'pieza'])
    expect(faltan({ ...PEDIDO_VACIO, ocasion: 'Mascota', pieza: 'Aún no lo sé' })).toEqual([])
  })
})

describe('enlaceDePedido', () => {
  it('abre el WhatsApp del negocio con el mensaje', () => {
    const url = new URL(enlaceDePedido({ ...PEDIDO_VACIO, ocasion: 'Mascota', pieza: 'Box temático' }, ORIGEN))
    expect(url.origin + url.pathname).toBe('https://wa.me/51999999999')
    expect(url.searchParams.get('text')).toContain('• Ocasión: Mascota')
  })
})
