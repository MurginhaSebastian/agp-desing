/*
 * Iconos de la web pública. Un juego propio y mínimo en vez de Lucide (el que usa casi toda web
 * hecha deprisa): trazo de 1.75, puntas redondas y solo los que hacen falta. Instagram y TikTok
 * también son propios porque Lucide ya no trae iconos de marca. El panel sigue con Lucide.
 *
 * Todos son decorativos (aria-hidden): el texto del botón o del enlace ya dice qué hacen.
 */
import type { ReactNode } from 'react'

interface Props {
  size?: number
  className?: string
}

function Svg({ size = 20, className, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export function FlechaDerecha(p: Props) {
  return <Svg {...p}><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></Svg>
}

export function FlechaIzquierda(p: Props) {
  return <Svg {...p}><path d="M20 12H5" /><path d="M11 6l-6 6 6 6" /></Svg>
}

/** Sale de la web (redes sociales). */
export function FlechaFuera(p: Props) {
  return <Svg {...p}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></Svg>
}

/** Baja a la sección siguiente. */
export function FlechaAbajo(p: Props) {
  return <Svg {...p}><path d="M12 4v15" /><path d="M6 13l6 6 6-6" /></Svg>
}

/** Bocadillo de conversación: el botón de WhatsApp. */
export function Conversar(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4.5 19.5l1.3-3.6A7.5 7.5 0 1 1 8.4 18.5z" />
    </Svg>
  )
}

export function Menu(p: Props) {
  return <Svg {...p}><path d="M4 8h16" /><path d="M4 16h16" /></Svg>
}

export function Cerrar(p: Props) {
  return <Svg {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Svg>
}

/** Para el pase de fotos de la portada. */
export function Pausa(p: Props) {
  return <Svg {...p}><path d="M9 5v14" /><path d="M15 5v14" /></Svg>
}

/** Vuelve a pasar las fotos. */
export function Seguir(p: Props) {
  return <Svg {...p}><path d="M8 5l11 7-11 7z" /></Svg>
}

export function Instagram(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </Svg>
  )
}

export function TikTok(p: Props) {
  return <Svg {...p}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></Svg>
}
