import type { SettingsRepository } from '@/services/contratos'
import { EMPTY_SETTINGS, type SiteSettings } from '@/types/settings'

/** Ajustes en memoria: el panel se puede probar sin backend (se pierden al recargar, a propósito). */
export function crearAjustesDemo(): SettingsRepository {
  let actuales: SiteSettings = { ...EMPTY_SETTINGS }

  return {
    async get() {
      await new Promise((r) => setTimeout(r, 80))
      return { ...actuales }
    },
    async save(settings) {
      actuales = { heroImageUrl: settings.heroImageUrl.trim() }
      return { ...actuales }
    },
  }
}
