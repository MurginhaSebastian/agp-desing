import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearServicios } from '@/services/servicios'
import type { ProductCreateDTO } from '@/types/product'

/*
 * En modo demo una foto subida es una dirección `blob:` que ocupa memoria hasta que se suelta.
 * Antes no se soltaba nunca. Ahora se suelta en cuanto ninguna obra ni la portada la usan.
 */
const foto = (n: number) => new File([String(n)], `${n}.jpg`, { type: 'image/jpeg' })
const obra = (imageUrl: string): ProductCreateDTO => ({
  name: `Obra ${imageUrl}`,
  description: '',
  priceCents: 100,
  currency: 'PEN',
  widthCm: 10,
  heightCm: 10,
  technique: 'x',
  imageUrl,
  status: 'AVAILABLE',
  featured: false,
})

describe('fotos del modo demo', () => {
  let n = 0
  const soltadas: string[] = []
  beforeEach(() => {
    vi.useFakeTimers()
    n = 0
    soltadas.length = 0
    vi.stubGlobal('URL', Object.assign(URL, {
      createObjectURL: () => `blob:${++n}`,
      revokeObjectURL: (u: string) => soltadas.push(u),
    }))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  async function subir(s: ReturnType<typeof crearServicios>, i: number) {
    const p = s.imagenes.subir(foto(i))
    await vi.advanceTimersByTimeAsync(400)
    return p
  }

  it('se suelta la que se sustituyó antes de guardar, no la guardada', async () => {
    const s = crearServicios(true)
    await subir(s, 1)
    const elegida = await subir(s, 2)
    await s.productos.create(obra(elegida))
    expect(soltadas).toEqual(['blob:1'])
  })

  it('al cambiar la foto de una obra se suelta la anterior; al borrarla, la suya', async () => {
    const s = crearServicios(true)
    const primera = await subir(s, 1)
    const creada = await s.productos.create(obra(primera))
    const segunda = await subir(s, 2)
    await s.productos.update(creada.id, { imageUrl: segunda })
    expect(soltadas).toEqual(['blob:1'])
    await s.productos.remove(creada.id)
    expect(soltadas).toEqual(['blob:1', 'blob:2'])
  })

  it('la foto de la portada se respeta mientras esté puesta', async () => {
    const s = crearServicios(true)
    const portada = await subir(s, 1)
    await s.ajustes.save({ heroImageUrl: portada })
    const otra = await subir(s, 2)
    const creada = await s.productos.create(obra(otra))
    await s.productos.remove(creada.id)
    expect(soltadas).toEqual(['blob:2'])
    await s.ajustes.save({ heroImageUrl: '' })
    expect(soltadas).toEqual(['blob:2', 'blob:1'])
  })

  it('las fotos de ejemplo no se tocan', async () => {
    const s = crearServicios(true)
    const [ejemplo] = await (async () => {
      const p = s.productos.list()
      await vi.advanceTimersByTimeAsync(120)
      return p
    })()
    await s.productos.remove(ejemplo.id)
    expect(soltadas).toEqual([])
  })
})
