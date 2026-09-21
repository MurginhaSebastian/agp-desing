import type { Product } from '@/types/product'

/**
 * Datos de demostración. Se usan cuando VITE_API_URL está vacío,
 * para poder ver la web sin levantar el backend.
 * Las imágenes son composiciones SVG de muestra: reemplazar por fotos reales.
 */
const base = {
  currency: 'COP' as const,
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-01T10:00:00Z',
}

export const mockProducts: Product[] = [
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000001',
    name: 'Tarde en Bordeaux',
    slug: 'tarde-en-bordeaux',
    description:
      'Campos de color superpuestos, del vino al rosa quemado. Pintado en tres sesiones sobre lienzo de algodón. Se ve distinto con luz de mañana y de noche, que es un poco la idea.',
    priceCents: 68000000,
    widthCm: 80,
    heightCm: 100,
    technique: 'Acrílico sobre lienzo',
    imageUrl: '/images/obras/01-tarde-en-bordeaux.svg',
    status: 'AVAILABLE',
    featured: true,
    ...base,
  },
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000002',
    name: 'Seda I',
    slug: 'seda-i',
    description:
      'Primera pieza de una serie de tres. Un solo trazo ancho sobre fondo crudo, sin retoques. Lo que salió en el primer intento es lo que quedó.',
    priceCents: 42000000,
    widthCm: 50,
    heightCm: 70,
    technique: 'Óleo sobre lienzo',
    imageUrl: '/images/obras/02-seda-i.svg',
    status: 'AVAILABLE',
    featured: true,
    ...base,
  },
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000003',
    name: 'Avena',
    slug: 'avena',
    description:
      'Formato horizontal para pared larga. Tonos de avena y greige con una línea roja que cruza de lado a lado. Funciona bien sobre un sofá o una cabecera.',
    priceCents: 95000000,
    widthCm: 150,
    heightCm: 60,
    technique: 'Mixta sobre madera',
    imageUrl: '/images/obras/03-avena.svg',
    status: 'AVAILABLE',
    featured: false,
    ...base,
  },
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000004',
    name: 'Retrato sin nombre',
    slug: 'retrato-sin-nombre',
    description:
      'Encargo. Un retrato a partir de una foto que el cliente envía; se trabaja la paleta según el espacio donde va a colgarse. Tiempo de entrega: 3 a 4 semanas.',
    priceCents: 120000000,
    widthCm: 60,
    heightCm: 80,
    technique: 'Óleo sobre lienzo',
    imageUrl: '/images/obras/04-retrato.svg',
    status: 'COMMISSION',
    featured: false,
    ...base,
  },
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000005',
    name: 'Humo rosa',
    slug: 'humo-rosa',
    description:
      'Pequeño formato. Veladuras de rosa sobre negro cálido. Ya tiene casa, pero se puede pintar una versión nueva por encargo.',
    priceCents: 28000000,
    widthCm: 30,
    heightCm: 40,
    technique: 'Acrílico sobre papel',
    imageUrl: '/images/obras/05-humo-rosa.svg',
    status: 'SOLD',
    featured: false,
    ...base,
  },
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000006',
    name: 'Línea de horizonte',
    slug: 'linea-de-horizonte',
    description:
      'Dos bloques, uno claro y uno oscuro, y el borde donde se tocan. De lejos es un paisaje. De cerca es textura.',
    priceCents: 74000000,
    widthCm: 90,
    heightCm: 90,
    technique: 'Óleo sobre lienzo',
    imageUrl: '/images/obras/06-horizonte.svg',
    status: 'AVAILABLE',
    featured: true,
    ...base,
  },
]
