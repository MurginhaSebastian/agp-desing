import type { SettingsRepository } from '@/services/contratos'
import { EMPTY_SETTINGS, type SiteSettings } from '@/types/settings'

/** Los ajustes del demo, más qué foto usa la portada (para no soltarla). */
export interface AjustesDemo extends SettingsRepository {
  fotoEnUso(): string
}

/**
 * Ajustes en memoria: el panel se puede probar sin backend (se pierden al recargar, a propósito).
 * `alCambiar` se llama después de cada guardado.
 */
export function crearAjustesDemo(alCambiar: () => void = () => {}): AjustesDemo {
  let actuales: SiteSettings = { ...EMPTY_SETTINGS }

  return {
    fotoEnUso: () => actuales.heroImageUrl,
    async get() {
      await new Promise((r) => setTimeout(r, 80))
      return { ...actuales }
    },
    async save(settings) {
      actuales = { heroImageUrl: settings.heroImageUrl.trim() }
      alCambiar()
      return { ...actuales }
    },
  }
}
