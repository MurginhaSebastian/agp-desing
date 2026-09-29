import { isDemoMode } from '@/config/env'
import { http } from '@/services/http'

/**
 * Única puerta hacia /api/imagenes. Manda el archivo tal cual: no se recomprime ni se recorta,
 * así que la foto que se publica es la que se eligió. El servidor le quita los datos escondidos
 * (ubicación GPS, modelo del teléfono) sin tocar la imagen, y devuelve la dirección pública.
 */

interface Subida {
  url: string
}

const demo = {
  /**
   * Modo demo (sin backend): se devuelve la dirección local del archivo para poder probar el
   * panel. Vive solo en esta pestaña y se pierde al recargar, a propósito: sin servidor no hay
   * dónde guardar la foto.
   */
  async subir(archivo: File): Promise<string> {
    await new Promise((r) => setTimeout(r, 400))
    return URL.createObjectURL(archivo)
  },
}

const remote = {
  async subir(archivo: File): Promise<string> {
    const cuerpo = new FormData()
    cuerpo.append('archivo', archivo)
    const { url } = await http<Subida>('/api/imagenes', { method: 'POST', body: cuerpo, auth: true })
    return url
  },
}

export const imagenService = isDemoMode ? demo : remote
