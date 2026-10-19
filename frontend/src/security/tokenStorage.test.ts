import { afterEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '@/security/tokenStorage'

const dentroDe = (ms: number) => new Date(Date.now() + ms).toISOString()

describe('tokenStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('guarda y devuelve el token mientras no caduque', () => {
    tokenStorage.set('abc', dentroDe(60_000))
    expect(tokenStorage.get()).toBe('abc')
  })

  it('un token caducado no vale y se borra', () => {
    tokenStorage.set('abc', dentroDe(-1))
    expect(tokenStorage.get()).toBeNull()
    expect(sessionStorage.getItem('agp.admin.token')).toBeNull()
  })

  it('sin fecha de caducidad no hay sesión', () => {
    sessionStorage.setItem('agp.admin.token', 'abc')
    expect(tokenStorage.get()).toBeNull()
  })

  it('una fecha de caducidad ilegible cuenta como caducada', () => {
    tokenStorage.set('abc', 'no-es-fecha')
    expect(tokenStorage.get()).toBeNull()
    expect(sessionStorage.getItem('agp.admin.token')).toBeNull()
  })

  it('clear cierra la sesión', () => {
    tokenStorage.set('abc', dentroDe(60_000))
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })

  it('caducidad devuelve los ms de la caducidad, o null sin sesión válida', () => {
    expect(tokenStorage.caducidad()).toBeNull()
    const exp = dentroDe(60_000)
    tokenStorage.set('abc', exp)
    expect(tokenStorage.caducidad()).toBe(Date.parse(exp))
    tokenStorage.set('abc', dentroDe(-1))
    expect(tokenStorage.caducidad()).toBeNull()
  })

  it('con sessionStorage bloqueado no lanza: no hay sesión y guardar se ignora', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(() => tokenStorage.set('abc', dentroDe(60_000))).not.toThrow()
    expect(tokenStorage.get()).toBeNull()
    expect(tokenStorage.caducidad()).toBeNull()
  })
})
