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
  /** Solo dígitos (wa.me no acepta "+" ni espacios); se limpia lo que venga del .env */
  whatsappNumber: optional(raw.VITE_WHATSAPP_NUMBER, '51977463110').replace(/\D/g, ''),
  instagramUrl: optional(raw.VITE_INSTAGRAM_URL, 'https://www.instagram.com/agp_desinger/'),
  tiktokUrl: optional(raw.VITE_TIKTOK_URL, 'https://www.tiktok.com/@agp.desing'),
  brandName: 'AGP Desing',
} as const

export const isDemoMode = env.apiUrl === ''
