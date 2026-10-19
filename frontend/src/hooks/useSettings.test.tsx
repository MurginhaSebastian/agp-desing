import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettings } from '@/hooks/useSettings'
import { ApiError } from '@/types/api'
import { EMPTY_SETTINGS, type SiteSettings } from '@/types/settings'

const get = vi.fn<() => Promise<SiteSettings>>()
const save = vi.fn<(s: SiteSettings) => Promise<SiteSettings>>()
vi.mock('@/services/servicios', () => ({ settingsService: { get: () => get(), save: (s: SiteSettings) => save(s) } }))

describe('useSettings', () => {
  beforeEach(() => {
    get.mockReset()
    save.mockReset()
  })
  afterEach(() => cleanup())

  it('arranca cargando con los ajustes vacíos y luego trae los del servidor', async () => {
    get.mockResolvedValue({ heroImageUrl: 'https://x/h.jpg' })
    const { result } = renderHook(() => useSettings())
    expect(result.current.loading).toBe(true)
    expect(result.current.settings).toEqual(EMPTY_SETTINGS)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.settings.heroImageUrl).toBe('https://x/h.jpg')
    expect(result.current.error).toBeNull()
  })

  it('si falla, deja los ajustes vacíos (la portada debe pintarse) y da el mensaje', async () => {
    get.mockRejectedValue(new ApiError({ title: 'Caído', status: 503 }))
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.settings).toEqual(EMPTY_SETTINGS)
    expect(result.current.error).toBe('Caído')
  })

  it('con un error cualquiera usa el mensaje por defecto', async () => {
    get.mockRejectedValue('raro')
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('No se pudieron cargar los ajustes')
  })

  it('save guarda, actualiza el estado y devuelve lo guardado', async () => {
    get.mockResolvedValue(EMPTY_SETTINGS)
    save.mockResolvedValue({ heroImageUrl: 'nueva' })
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))
    let devuelto: SiteSettings | undefined
    await act(async () => {
      devuelto = await result.current.save({ heroImageUrl: 'nueva' })
    })
    expect(save).toHaveBeenCalledWith({ heroImageUrl: 'nueva' })
    expect(devuelto).toEqual({ heroImageUrl: 'nueva' })
    expect(result.current.settings.heroImageUrl).toBe('nueva')
  })

  it('si save falla, lanza y no pisa el estado', async () => {
    get.mockResolvedValue({ heroImageUrl: 'vieja' })
    save.mockRejectedValue(new Error('no'))
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await expect(result.current.save({ heroImageUrl: 'x' })).rejects.toThrow('no')
    })
    expect(result.current.settings.heroImageUrl).toBe('vieja')
  })

  it('reload vuelve a pedir y limpia el error', async () => {
    get.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce({ heroImageUrl: 'ok' })
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.error).not.toBeNull())
    await act(async () => {
      await result.current.reload()
    })
    expect(result.current.error).toBeNull()
    expect(result.current.settings.heroImageUrl).toBe('ok')
  })
})
