import { env } from '@/config/env'

/*
 * Los enlaces que se repiten por la web, escritos una vez. Una sección nueva en la portada o una
 * red social nueva se añaden aquí y aparecen en el menú, el pie y el contacto a la vez.
 */

interface Seccion {
  to: string
  label: string
  /** El pie no repite «Contacto»: la hoja de contacto está justo encima de él. */
  enPie: boolean
}

export const SECCIONES: readonly Seccion[] = [
  { to: '/#sobre', label: 'Sobre AGP', enPie: true },
  { to: '/#como-funciona', label: 'Cómo funciona', enPie: true },
  { to: '/catalogo', label: 'Catálogo', enPie: true },
  { to: '/#faq', label: 'Preguntas frecuentes', enPie: true },
  { to: '/#contacto', label: 'Contacto', enPie: false },
]

interface Red {
  nombre: 'Instagram' | 'TikTok'
  url: string
}

export const REDES: readonly Red[] = [
  { nombre: 'Instagram', url: env.instagramUrl },
  { nombre: 'TikTok', url: env.tiktokUrl },
]
