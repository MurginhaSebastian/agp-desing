/** Espejo de SiteSettingsResponse.java. Cadena vacía = sin imagen de portada. */
export interface SiteSettings {
  heroImageUrl: string
}

export const EMPTY_SETTINGS: SiteSettings = { heroImageUrl: '' }
