/**
 * Configuración pública del frontend.
 * Todo lo que empieza con VITE_ termina en el bundle: aquí NO van secretos.
 */
const raw = import.meta.env

function optional(value: string | undefined, fallback: string): string {
  const v = value?.trim()
  return v ? v : fallback
}

export const env = {
  /** URL base del backend. Vacío = modo demo con datos locales. */
  apiUrl: optional(raw.VITE_API_URL, '').replace(/\/$/, ''),
  /** Número en formato E.164 sin "+", ej. 573001234567 */
  whatsappNumber: optional(raw.VITE_WHATSAPP_NUMBER, '573000000000'),
  instagramUrl: optional(raw.VITE_INSTAGRAM_URL, 'https://instagram.com/agpdesing'),
  tiktokUrl: optional(raw.VITE_TIKTOK_URL, 'https://tiktok.com/@agpdesing'),
  brandName: 'AGP Desing',
} as const

export const isDemoMode = env.apiUrl === ''
