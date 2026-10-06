/*
 * Curvas de animación para Motion. Son las mismas de `index.css` (`--ease-out`, `--ease-in-out`,
 * `--ease-drawer`): si cambia una, cambia la otra. Nunca `ease-in` en la interfaz.
 */

/** La de casi todo: entra rápido y frena suave. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const

/** Para lo que se mueve de un sitio a otro ya en pantalla (recolocar el catálogo, la foto que viaja). */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

/** El menú del móvil, que entra desde el borde. */
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const
