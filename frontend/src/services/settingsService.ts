import { isDemoMode } from '@/config/env'
import { http } from '@/services/http'
import { EMPTY_SETTINGS, type SiteSettings } from '@/types/settings'

/**
 * Única puerta hacia /api/settings. En modo demo guarda en memoria, así el
 * panel se puede probar sin backend (se pierde al recargar, a propósito).
 */

let demoStore: SiteSettings = { ...EMPTY_SETTINGS }

const demo = {
  async get(): Promise<SiteSettings> {
    await new Promise((r) => setTimeout(r, 80))
    return { ...demoStore }
  },
  async save(settings: SiteSettings): Promise<SiteSettings> {
    demoStore = { heroImageUrl: settings.heroImageUrl.trim() }
    return { ...demoStore }
  },
}

const remote = {
  get: () => http<SiteSettings>('/api/settings'),
  save: (settings: SiteSettings) =>
    http<SiteSettings>('/api/settings', { method: 'PUT', body: settings, auth: true }),
}

export const settingsService = isDemoMode ? demo : remote
