import { afterEach, describe, expect, it, vi } from 'vitest'

// env.ts evalúa todo al importarse: cada caso fija variables y lo importa de nuevo.
async function cargar(vars: Record<string, string>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v)
  return import('@/config/env')
}

afterEach(() => vi.unstubAllEnvs())

describe('env', () => {
  it('sin configurar: modo demo y contactos de ejemplo marcados como sin configurar', async () => {
    const m = await cargar({ VITE_API_URL: '', VITE_WHATSAPP_NUMBER: '', VITE_CONTACT_EMAIL: '' })
    expect(m.isDemoMode).toBe(true)
    expect(m.contactosSinConfigurar).toBe(true)
    expect(m.env.maxImagenMb).toBe(5)
  })

  it('apiUrl pierde espacios y la barra final; con ella ya no es demo', async () => {
    const m = await cargar({ VITE_API_URL: '  https://api.test/ ' })
    expect(m.env.apiUrl).toBe('https://api.test')
    expect(m.isDemoMode).toBe(false)
  })

  it('el WhatsApp queda solo en dígitos', async () => {
    const m = await cargar({ VITE_WHATSAPP_NUMBER: '+51 987-654 321' })
    expect(m.env.whatsappNumber).toBe('51987654321')
  })

  it('con WhatsApp y correo propios, contactosSinConfigurar es false; con uno solo de ejemplo, true', async () => {
    const ambos = await cargar({ VITE_WHATSAPP_NUMBER: '51987654321', VITE_CONTACT_EMAIL: 'hola@agp.pe' })
    expect(ambos.contactosSinConfigurar).toBe(false)
    const soloUno = await cargar({ VITE_WHATSAPP_NUMBER: '51987654321', VITE_CONTACT_EMAIL: '' })
    expect(soloUno.contactosSinConfigurar).toBe(true)
  })

  it('maxImagenMb: número válido se respeta; basura o 0 caen a 5', async () => {
    expect((await cargar({ VITE_MAX_IMAGEN_MB: '8' })).env.maxImagenMb).toBe(8)
    expect((await cargar({ VITE_MAX_IMAGEN_MB: 'mucho' })).env.maxImagenMb).toBe(5)
    expect((await cargar({ VITE_MAX_IMAGEN_MB: '0' })).env.maxImagenMb).toBe(5)
  })
})
