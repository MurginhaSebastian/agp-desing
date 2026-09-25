import type { Product } from '@/types/product'

/**
 * Datos de demostración. Se usan cuando VITE_API_URL está vacío,
 * para poder ver la web sin levantar el backend.
 * Las imágenes son composiciones SVG de muestra: reemplazar por fotos reales.
 */
const base = {
  currency: 'PEN' as const,
  technique: '3D y ensamblado',
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-01T10:00:00Z',
}

export const mockProducts: Product[] = [
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000001',
    name: 'Cuadro 3D Fórmula 1',
    slug: 'cuadro-3d-formula-1',
    description:
      'Circuito y monoplaza en capas, con la vuelta rápida y los tiempos de tu carrera favorita. Se personaliza el equipo, el piloto y la fecha.',
    priceCents: 7500,
    widthCm: 30,
    heightCm: 40,
    imageUrl: '/images/obras/01-tarde-en-bordeaux.svg',
    status: 'AVAILABLE',
    featured: true,
    ...base,
  },
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000002',
    name: 'Box Aniversario Streaming',
    slug: 'box-aniversario-streaming',
    description:
      'Caja completa con la interfaz de tu plataforma replicada, la canción de los dos y espacio para fotos. Incluye empaque estructurado y tarjeta.',
    priceCents: 11500,
    widthCm: 25,
    heightCm: 35,
    imageUrl: '/images/obras/02-seda-i.svg',
    status: 'AVAILABLE',
    featured: true,
    ...base,
  },
  {
    id: '2b6c1c2e-9a4e-4e1a-8d6e-000000000003',
    name: 'Cuadrito para Mascotas',
    slug: 'cuadrito-para-mascotas',
    description:
      'Retrato en miniatura de tu mascota con su nombre y su huella. Formato pequeño, pensado para un escritorio o una repisa.',
    priceCents: 5500,
    widthCm: 20,
    heightCm: 20,
    imageUrl: '/images/obras/03-avena.svg',
    status: 'AVAILABLE',
    featured: true,
    ...base,
  },
]
