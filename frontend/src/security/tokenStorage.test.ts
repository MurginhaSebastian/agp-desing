import { afterEach, describe, expect, it } from 'vitest'
import { tokenStorage } from '@/security/tokenStorage'

const dentroDe = (ms: number) => new Date(Date.now() + ms).toISOString()

describe('tokenStorage', () => {
  afterEach(() => sessionStorage.clear())

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

  it('clear cierra la sesión', () => {
    tokenStorage.set('abc', dentroDe(60_000))
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })
})
