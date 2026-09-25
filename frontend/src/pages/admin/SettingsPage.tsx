import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ApiError } from '@/types/api'
import type { SiteSettings } from '@/types/settings'

/** Ajustes de la web. Hoy solo la imagen de la portada. */
export function SettingsPage() {
  const { settings, loading, save } = useSettings()

  if (loading) return <p className="label" role="status">Cargando ajustes…</p>

  return (
    <>
      <p className="label-brand">Ajustes</p>
      <h1 className="text-h2 mt-2 mb-10">Portada</h1>
      {/* Sin key: el guard de `loading` hace que el formulario nazca ya con el valor
          cargado, y una key derivada del valor lo remontaría en cada guardado. */}
      <HeroImageForm initial={settings.heroImageUrl} onSave={save} />
    </>
  )
}

interface FormProps {
  initial: string
  onSave: (settings: SiteSettings) => Promise<SiteSettings>
}

function HeroImageForm({ initial, onSave }: FormProps) {
  const [url, setUrl] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = url.trim()
    // Misma regla que SiteSettingsRequest en el backend.
    if (value !== '' && !/^(https?:\/\/|\/)/.test(value)) {
      setError('Debe ser una URL (https://…) o una ruta que empiece por /. Déjalo vacío para quitar la imagen.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSave({ heroImageUrl: value })
      setSaved(true)
    } catch (err) {
      setSaved(false)
      if (err instanceof ApiError && err.fieldErrors.heroImageUrl) setError(err.fieldErrors.heroImageUrl)
      else setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setBusy(false)
    }
  }

  const preview = url.trim()

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <label htmlFor="heroImageUrl" className="field-label">Imagen de la portada</label>
        <input
          id="heroImageUrl"
          type="url"
          className="field-input"
          value={url}
          placeholder="https://… o /images/productos/mi-diseño.jpg"
          aria-invalid={error ? true : undefined}
          aria-describedby="hero-help"
          onChange={(e) => {
            setUrl(e.target.value)
            setSaved(false)
          }}
        />
        {error && <p className="field-error">{error}</p>}
        <p id="hero-help" className="mt-1.5 text-sm text-ink-soft">
          Aparece junto al titular, en formato vertical. Sube la foto a Cloudinary (o
          déjala en <code className="font-mono">public/images/</code>) y pega aquí el enlace.
          <strong className="font-semibold"> Déjalo vacío</strong> y la portada vuelve a ser solo texto.
        </p>

        <div className="mt-8 flex items-center gap-4">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
          {saved && (
            <p className="label inline-flex items-center gap-1.5 text-brand" role="status">
              <Check size={16} strokeWidth={2} aria-hidden="true" /> Guardado
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 lg:col-start-9">
        <p className="label mb-3">Vista previa</p>
        <div className="aspect-[3/4] max-w-xs lg:max-w-none bg-nude border border-oat overflow-hidden">
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <p className="size-full grid place-items-center text-center px-6 text-sm text-ink-soft">
              Sin imagen: la portada se queda solo con el titular.
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
