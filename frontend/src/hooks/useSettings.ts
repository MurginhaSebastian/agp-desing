import { useCallback, useEffect, useState } from 'react'
import { settingsService } from '@/services/settingsService'
import { EMPTY_SETTINGS, type SiteSettings } from '@/types/settings'

interface State {
  settings: SiteSettings
  loading: boolean
  error: string | null
}

/**
 * Ajustes de la web. Si la petición falla se devuelve el valor vacío en vez de
 * un error visible: la portada tiene que renderizar aunque el backend no conteste.
 */
export function useSettings() {
  const [state, setState] = useState<State>({ settings: EMPTY_SETTINGS, loading: true, error: null })

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const settings = await settingsService.get()
      setState({ settings, loading: false, error: null })
    } catch (e) {
      setState({
        settings: EMPTY_SETTINGS,
        loading: false,
        error: e instanceof Error ? e.message : 'No se pudieron cargar los ajustes',
      })
    }
  }, [])

  const save = useCallback(async (settings: SiteSettings) => {
    const saved = await settingsService.save(settings)
    setState({ settings: saved, loading: false, error: null })
    return saved
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...state, reload, save }
}
