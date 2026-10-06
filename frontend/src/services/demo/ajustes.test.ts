import { describe, expect, it } from 'vitest'
import { crearAjustesDemo } from '@/services/demo/ajustes'

describe('ajustes en modo demo', () => {
  it('empieza sin imagen de portada y guarda recortando espacios', async () => {
    const ajustes = crearAjustesDemo()
    expect(await ajustes.get()).toEqual({ heroImageUrl: '' })
    expect(await ajustes.save({ heroImageUrl: '  /portada.jpg ' })).toEqual({ heroImageUrl: '/portada.jpg' })
    expect(await ajustes.get()).toEqual({ heroImageUrl: '/portada.jpg' })
  })
})
