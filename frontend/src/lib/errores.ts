import { ApiError } from '@/types/api'

/** El texto que se le enseña a la persona cuando algo falla, o `porDefecto` si el error no trae uno. */
export function mensajeDe(e: unknown, porDefecto: string): string {
  return e instanceof Error ? e.message : porDefecto
}

/**
 * Los errores por campo que manda el backend (`errors` del ProblemDetail), para pintarlos bajo
 * cada casilla. Vacío si el error no es de la API o no trae ninguno.
 */
export function erroresDeCampo(e: unknown): Record<string, string> {
  return e instanceof ApiError ? e.fieldErrors : {}
}
