import { useEffect, useId, useRef, useState } from 'react'
import { env } from '@/config/env'
import { imagenService } from '@/services/imagenService'
import { ApiError } from '@/types/api'

/**
 * Elegir una foto del ordenador y dejarla subida.
 *
 * Reemplaza los campos donde antes había que pegar una URL, que obligaba a subir la foto a un
 * sitio ajeno primero. Aquí se elige el archivo, se ve al momento y se sube; lo que se guarda en
 * el formulario es la dirección que devuelve el servidor.
 *
 * Forma: la foto entra en un passe-partout, como en el taller, y se ve **entera**
 * (`object-contain`): en este proyecto las fotos no se recortan nunca, ni en la vista previa.
 * Debajo, a modo de ficha de museo, los formatos y el peso máximo — dichos antes de que falle
 * nada, no como regaño después.
 */

const MAX_MB = env.maxImagenMb
const MAX_BYTES = MAX_MB * 1024 * 1024
const FORMATOS = 'image/jpeg,image/png,image/webp'

interface Props {
  /** Dirección actual de la foto, o cadena vacía si no hay. */
  valor: string
  /** Se llama con la dirección nueva, o con cadena vacía al quitarla. */
  onChange: (url: string) => void
  etiqueta: string
  /** Texto propio bajo el campo; si no se pasa, solo se dice el formato y el peso. */
  ayuda?: string
  /** Error que venga del formulario (por ejemplo, del servidor al guardar). */
  error?: string
  requerido?: boolean
  /** Deja quitar la foto y quedarse sin ninguna (la portada puede ir solo con texto). */
  permiteQuitar?: boolean
}

function enMegas(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString('es-PE', { maximumFractionDigits: 1 })} MB`
}

export function SubirImagen({
  valor,
  onChange,
  etiqueta,
  ayuda,
  error,
  requerido = false,
  permiteQuitar = false,
}: Props) {
  const idBase = useId()
  const idCampo = `${idBase}-archivo`
  const idAyuda = `${idBase}-ayuda`
  const idError = `${idBase}-error`

  const entrada = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)
  /** Vista previa local mientras la foto viaja; después manda la dirección del servidor. */
  const [local, setLocal] = useState<string | null>(null)

  // Una dirección local ocupa memoria hasta que se suelta: se suelta al cambiar y al salir.
  useEffect(() => {
    return () => {
      if (local) URL.revokeObjectURL(local)
    }
  }, [local])

  const mensaje = fallo ?? error ?? null
  const mostrada = local ?? (valor.trim() || null)

  async function elegida(archivo: File | undefined) {
    if (!archivo) return
    setFallo(null)

    // El aviso de peso se da aquí, antes de enviar: así se sabe al momento y no después de
    // esperar la subida entera. El servidor lo vuelve a comprobar de todas formas.
    if (archivo.size > MAX_BYTES) {
      setFallo(`Esa foto pesa ${enMegas(archivo.size)} y el máximo son ${MAX_MB} MB. Reduce su tamaño y vuelve a elegirla.`)
      limpiarEntrada()
      return
    }
    if (archivo.size === 0) {
      setFallo('Ese archivo está vacío. Elige otro.')
      limpiarEntrada()
      return
    }

    if (local) URL.revokeObjectURL(local)
    setLocal(URL.createObjectURL(archivo))
    setSubiendo(true)
    try {
      const url = await imagenService.subir(archivo)
      onChange(url)
    } catch (e) {
      setLocal(null)
      // El backend manda el motivo en `errors.archivo` (peso, formato, almacén sin configurar);
      // si no, sirve el mensaje general.
      setFallo(
        e instanceof ApiError
          ? (e.fieldErrors.archivo ?? e.message)
          : e instanceof Error
            ? e.message
            : 'No se pudo subir la foto.',
      )
    } finally {
      setSubiendo(false)
      limpiarEntrada()
    }
  }

  /** Vaciar el input para que elegir dos veces el mismo archivo vuelva a disparar el cambio. */
  function limpiarEntrada() {
    if (entrada.current) entrada.current.value = ''
  }

  function quitar() {
    if (local) URL.revokeObjectURL(local)
    setLocal(null)
    setFallo(null)
    onChange('')
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start">
      {/*
        El passe-partout. Vacío es solo un hueco reservado con una línea fina; con foto se
        convierte en el cartón de montaje (`bg-nude`) y la pieza pasa a tener presencia.
        La foto se ve entera, con margen: aquí tampoco se recorta nada.
      */}
      <figure
        className={`grid place-items-center border p-3 ${
          mostrada ? 'bg-nude border-oat' : 'min-h-40 border-greige'
        }`}
      >
        {mostrada ? (
          <img
            src={mostrada}
            alt=""
            className="w-auto max-w-full max-h-72 object-contain motion-safe:transition-opacity"
            style={{ opacity: subiendo ? 0.55 : 1 }}
          />
        ) : (
          <p className="px-4 text-center text-sm text-ink-soft">Todavía sin foto</p>
        )}
      </figure>

      <div>
        <p className="field-label" id={`${idBase}-titulo`}>
          {etiqueta} {requerido && <span aria-hidden="true" className="text-brand">*</span>}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {/* Input real, alcanzable con teclado (sr-only, no display:none), con el label como botón. */}
          <input
            ref={entrada}
            id={idCampo}
            type="file"
            accept={FORMATOS}
            className="sr-only peer"
            disabled={subiendo}
            aria-describedby={mensaje ? `${idError} ${idAyuda}` : idAyuda}
            aria-invalid={mensaje ? true : undefined}
            onChange={(e) => void elegida(e.target.files?.[0])}
          />
          <label
            htmlFor={idCampo}
            className="btn-secondary peer-focus-visible:outline-2 peer-focus-visible:outline-brand peer-focus-visible:outline-offset-3 peer-disabled:opacity-50 peer-disabled:cursor-default"
          >
            {mostrada ? 'Cambiar foto' : 'Elegir foto'}
          </label>

          {permiteQuitar && mostrada && !subiendo && (
            <button type="button" className="btn-ghost" onClick={quitar}>
              Quitar
            </button>
          )}

          {subiendo && (
            <p className="label" role="status">
              Subiendo…
            </p>
          )}
        </div>

        {/* Ficha: formato y peso, dichos de entrada. */}
        <p id={idAyuda} className="mt-3 text-sm text-ink-soft">
          JPG, PNG o WebP, hasta {MAX_MB} MB. {ayuda}
        </p>

        {mensaje && (
          <p id={idError} className="field-error" role="alert">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}
