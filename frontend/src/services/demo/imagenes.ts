import type { ImageUploader } from '@/services/contratos'

/** El subidor del demo, más lo que hace falta para soltar la memoria de las fotos que ya nadie usa. */
export interface ImagenesDemo extends ImageUploader {
  /** Suelta las fotos subidas en esta pestaña que no estén en `enUso`. */
  liberarSinUso(enUso: ReadonlySet<string>): void
}

/**
 * Sin backend no hay dónde guardar la foto: se devuelve la dirección local del archivo para poder
 * probar el panel. Vive solo en esta pestaña y se pierde al recargar.
 *
 * Cada dirección local ocupa memoria hasta que se suelta. Se apuntan las que se reparten y se
 * sueltan cuando ninguna obra ni la portada las usan (una foto sustituida antes de guardar, la de
 * una obra borrada…). Las fotos de ejemplo no son de aquí y nunca se tocan.
 */
export function crearImagenesDemo(): ImagenesDemo {
  const repartidas = new Set<string>()

  return {
    async subir(archivo) {
      await new Promise((r) => setTimeout(r, 400))
      const url = URL.createObjectURL(archivo)
      repartidas.add(url)
      return url
    },
    liberarSinUso(enUso) {
      for (const url of repartidas) {
        if (enUso.has(url)) continue
        URL.revokeObjectURL(url)
        repartidas.delete(url)
      }
    },
  }
}
