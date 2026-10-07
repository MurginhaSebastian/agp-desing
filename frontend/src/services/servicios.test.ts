import { describe, expect, it } from 'vitest'
import { productService, crearServicios } from '@/services/servicios'
import { ajustesRemotos, imagenesRemotas, productosRemotos, sesionRemota, ventasRemotas } from '@/services/remoto/api'

describe('crearServicios', () => {
  it('con backend usa la API para todo', () => {
    expect(crearServicios(false)).toEqual({
      productos: productosRemotos,
      ajustes: ajustesRemotos,
      sesion: sesionRemota,
      imagenes: imagenesRemotas,
      ventas: ventasRemotas,
    })
  })

  it('en modo demo, cada llamada tiene su propio almacén', async () => {
    const a = crearServicios(true)
    const b = crearServicios(true)
    const [primera] = await a.productos.list()
    await a.productos.remove(primera.id)
    expect((await b.productos.list()).some((p) => p.id === primera.id)).toBe(true)
  })

  it('la web usa un único juego de servicios, creado al cargar', async () => {
    // Las pruebas corren sin VITE_API_URL: modo demo.
    const [primera] = await productService.list()
    await productService.remove(primera.id)
    const { productService: otraVez } = await import('@/services/servicios')
    expect((await otraVez.list()).some((p) => p.id === primera.id)).toBe(false)
  })
})
