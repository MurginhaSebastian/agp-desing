import { enlaceWhatsApp } from '@/lib/whatsapp'

/*
 * «Arma tu pedido»: las respuestas del cliente se convierten en un mensaje de WhatsApp ya
 * escrito. Nada sale del navegador hasta que el cliente lo envía él mismo desde WhatsApp.
 */

export const OCASIONES = [
  'Aniversario',
  'Cumpleaños',
  'Día de la Madre o del Padre',
  'Fútbol o deporte',
  'Mascota',
  'Oficina o empresa',
  'Otra',
] as const

export const PIEZAS = ['Cuadro 3D', 'Box temático', 'Aún no lo sé'] as const

export const TAMANOS = ['Pequeño', 'Mediano', 'Grande', 'Lo vemos juntos'] as const

export type Entrega = 'trujillo' | 'provincia'

export interface Pedido {
  ocasion: string
  pieza: string
  /** La obra del catálogo de la que se parte; null = diseño desde cero. */
  obra: { name: string; slug: string } | null
  tamano: string
  texto: string
  idea: string
  entrega: Entrega
  ciudad: string
  /** AAAA-MM-DD, como lo da <input type="date">. Vacío = sin fecha. */
  fecha: string
}

export const PEDIDO_VACIO: Pedido = {
  ocasion: '',
  pieza: '',
  obra: null,
  tamano: '',
  texto: '',
  idea: '',
  entrega: 'trujillo',
  ciudad: '',
  fecha: '',
}

/** Lo mínimo para que el mensaje sirva: para qué es y qué pieza. */
export function faltan(p: Pedido): Array<'ocasion' | 'pieza'> {
  const f: Array<'ocasion' | 'pieza'> = []
  if (!p.ocasion) f.push('ocasion')
  if (!p.pieza) f.push('pieza')
  return f
}

/** 2027-02-14 → 14/02/2027. Se trocea a mano: con `new Date` la zona horaria movía el día. */
function fechaPeruana(iso: string): string {
  const [a, m, d] = iso.split('-')
  return a && m && d ? `${d}/${m}/${a}` : iso
}

export function mensajeDePedido(p: Pedido, origen: string): string {
  const lineas = ['Hola, vengo de la web. Quiero hacer un pedido:']
  const dato = (nombre: string, valor: string) => {
    const v = valor.replace(/\s+/g, ' ').trim()
    if (v) lineas.push(`• ${nombre}: ${v}`)
  }

  dato('Ocasión', p.ocasion)
  dato('Pieza', p.pieza)
  dato(
    'Diseño',
    p.obra ? `a partir de «${p.obra.name}» ${origen}/catalogo/${encodeURIComponent(p.obra.slug)}` : 'desde cero',
  )
  if (p.pieza !== 'Box temático') dato('Tamaño', p.tamano)
  dato('Lleva escrito', p.texto)
  dato('La idea', p.idea)
  dato('Entrega', p.entrega === 'trujillo' ? 'en Trujillo' : `envío a ${p.ciudad.trim() || 'otra provincia'}`)
  if (p.fecha) dato('Lo necesito para el', fechaPeruana(p.fecha))

  lineas.push('', 'Te mando las fotos de referencia por aquí.')
  return lineas.join('\n')
}

export function enlaceDePedido(p: Pedido, origen: string): string {
  return `${enlaceWhatsApp()}?text=${encodeURIComponent(mensajeDePedido(p, origen))}`
}
