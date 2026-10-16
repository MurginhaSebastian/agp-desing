import { describe, expect, it } from 'vitest'
import { fotoReducida, marcarSinCopia } from '@/lib/fotos'

const ALMACEN = 'https://abc.supabase.co/storage/v1/object/public/productos'
const UUID = '3f2b1c9e-8d7a-4b6c-9e1f-0a2b3c4d5e6f'

describe('fotoReducida', () => {
  it('a una foto JPG o PNG del almacén le corresponde su copia .min.jpg', () => {
    expect(fotoReducida(`${ALMACEN}/${UUID}.jpg`)).toBe(`${ALMACEN}/${UUID}.min.jpg`)
    expect(fotoReducida(`${ALMACEN}/${UUID}.PNG`)).toBe(`${ALMACEN}/${UUID}.min.jpg`)
  })

  it('WebP, fotos de muestra y direcciones raras se quedan como están', () => {
    expect(fotoReducida(`${ALMACEN}/${UUID}.webp`)).toBe(`${ALMACEN}/${UUID}.webp`)
    expect(fotoReducida('/images/obras/01-tarde-en-bordeaux.svg')).toBe('/images/obras/01-tarde-en-bordeaux.svg')
    expect(fotoReducida(`${ALMACEN}/mi-foto.jpg`)).toBe(`${ALMACEN}/mi-foto.jpg`)
    expect(fotoReducida(`${ALMACEN}/${UUID}.min.jpg`)).toBe(`${ALMACEN}/${UUID}.min.jpg`)
  })

  it('una foto cuya copia no existe vuelve a la original y no se vuelve a intentar', () => {
    const vieja = `${ALMACEN}/0f2b1c9e-8d7a-4b6c-9e1f-0a2b3c4d5e6f.jpg`
    marcarSinCopia(vieja)
    expect(fotoReducida(vieja)).toBe(vieja)
  })
})
