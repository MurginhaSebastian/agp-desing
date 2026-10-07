/**
 * Guarda un archivo que llegó por `fetch` (el CSV de ventas necesita la cabecera de sesión, así que
 * no vale un enlace normal). La dirección `blob:` se suelta en cuanto el navegador empieza la
 * descarga.
 */
export function descargar(archivo: Blob, nombre: string) {
  const url = URL.createObjectURL(archivo)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
