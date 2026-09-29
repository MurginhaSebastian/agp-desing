/**
 * Configuración pública del frontend.
 * Todo lo que empieza con VITE_ termina en el bundle: aquí NO van secretos.
 *
 * Los datos de contacto reales NO se escriben aquí: viven en `frontend/.env`
 * (ignorado por git) y en las variables del hosting. Lo que hay abajo son
 * valores de ejemplo, evidentemente falsos, para que la web se pueda ver sin
 * configurar nada y para que el repositorio no publique los contactos.
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
  whatsappNumber: optional(raw.VITE_WHATSAPP_NUMBER, '51999999999').replace(/\D/g, ''),
  instagramUrl: optional(raw.VITE_INSTAGRAM_URL, 'https://www.instagram.com/ejemplo/'),
  tiktokUrl: optional(raw.VITE_TIKTOK_URL, 'https://www.tiktok.com/@ejemplo'),
  /** Correo para las páginas legales (derechos de datos, contacto formal). */
  contactEmail: optional(raw.VITE_CONTACT_EMAIL, 'correo@ejemplo.com'),
  /**
   * Tope de peso de una foto, en MB. Tiene que coincidir con `MAX_IMAGEN_MB` del backend:
   * el panel avisa antes de enviar y el servidor lo vuelve a comprobar.
   */
  maxImagenMb: Number(optional(raw.VITE_MAX_IMAGEN_MB, '5')) || 5,
  brandName: 'AGP Desing',
} as const

/** Para avisar en el panel si se publicó sin configurar los contactos. */
export const contactosSinConfigurar =
  env.whatsappNumber === '51999999999' || env.contactEmail === 'correo@ejemplo.com'

export const isDemoMode = env.apiUrl === ''
