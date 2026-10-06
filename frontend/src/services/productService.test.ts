import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductCreateDTO } from '@/types/product'

/*
 * El almacén del modo demo vive en el módulo: se recarga en cada prueba para empezar
 * siempre con los datos de ejemplo.
 */
async function servicio() {
  vi.resetModules()
  return (await import('@/services/productService')).productService
}

const nuevo: ProductCreateDTO = {
  name: 'Ñandú en Acción',
  description: '',
  priceCents: 9_500,
  currency: 'PEN',
  widthCm: 30,
  heightCm: 40,
  technique: 'Cuadro 3D',
  imageUrl: '/images/obras/01.svg',
  status: 'AVAILABLE',
  featured: false,
}

describe('productService en modo demo', () => {
  let svc: Awaited<ReturnType<typeof servicio>>
  beforeEach(async () => {
    svc = await servicio()
  })

  it('empieza con las obras de ejemplo', async () => {
    const lista = await svc.list()
    expect(lista.map((p) => p.slug)).toEqual(['cuadro-3d-formula-1', 'box-aniversario-streaming', 'cuadrito-para-mascotas'])
  })

  it('devuelve copias: cambiar lo recibido no toca el almacén', async () => {
    const lista = await svc.list()
    lista[0].name = 'cambiado'
    expect((await svc.list())[0].name).not.toBe('cambiado')
  })

  it('busca por slug y por id, y avisa si no existe', async () => {
    const [primera] = await svc.list()
    expect((await svc.getBySlug(primera.slug)).id).toBe(primera.id)
    expect((await svc.getById(primera.id)).slug).toBe(primera.slug)
    await expect(svc.getBySlug('no-existe')).rejects.toThrow('No encontrado')
    await expect(svc.getById('no-existe')).rejects.toThrow('No encontrado')
  })

  it('crear pone la obra primero, con slug sin tildes y fechas', async () => {
    const creada = await svc.create(nuevo)
    expect(creada.slug).toBe('nandu-en-accion')
    expect(creada.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(creada.createdAt).toBe(creada.updatedAt)
    expect((await svc.list())[0].id).toBe(creada.id)
  })

  it('editar el nombre rehace el slug; editar otra cosa lo deja', async () => {
    const creada = await svc.create(nuevo)
    expect((await svc.update(creada.id, { priceCents: 100 })).slug).toBe('nandu-en-accion')
    const renombrada = await svc.update(creada.id, { name: 'Otra Cosa' })
    expect(renombrada.slug).toBe('otra-cosa')
    expect(renombrada.priceCents).toBe(100)
    await expect(svc.update('no-existe', {})).rejects.toThrow('No encontrado')
  })

  it('borrar la quita de la lista', async () => {
    const [primera] = await svc.list()
    await svc.remove(primera.id)
    expect((await svc.list()).some((p) => p.id === primera.id)).toBe(false)
  })
})
