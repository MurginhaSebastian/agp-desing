import { describe, expect, it, vi } from 'vitest'

describe('settingsService en modo demo', () => {
  it('empieza sin imagen de portada y guarda recortando espacios', async () => {
    vi.resetModules()
    const { settingsService } = await import('@/services/settingsService')
    expect(await settingsService.get()).toEqual({ heroImageUrl: '' })
    expect(await settingsService.save({ heroImageUrl: '  /portada.jpg ' })).toEqual({ heroImageUrl: '/portada.jpg' })
    expect(await settingsService.get()).toEqual({ heroImageUrl: '/portada.jpg' })
  })
})
