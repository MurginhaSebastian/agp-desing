import type { ImageUploader } from '@/services/contratos'

/**
 * Sin backend no hay dónde guardar la foto: se devuelve la dirección local del archivo para poder
 * probar el panel. Vive solo en esta pestaña y se pierde al recargar.
 */
export function crearImagenesDemo(): ImageUploader {
  return {
    async subir(archivo) {
      await new Promise((r) => setTimeout(r, 400))
      return URL.createObjectURL(archivo)
    },
  }
}
