import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { SubirImagen } from '@/components/admin/SubirImagen'
import { useSettings } from '@/hooks/useSettings'
import { erroresDeCampo, mensajeDe } from '@/lib/errores'
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
    setError(null)
    setBusy(true)
    try {
      await onSave({ heroImageUrl: url.trim() })
      setSaved(true)
    } catch (err) {
      setSaved(false)
      setError(erroresDeCampo(err).heroImageUrl || mensajeDe(err, 'No se pudo guardar.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-3xl">
      <SubirImagen
        etiqueta="Imagen de la portada"
        valor={url}
        permiteQuitar
        error={error ?? undefined}
        onChange={(nueva) => {
          setUrl(nueva)
          setSaved(false)
        }}
        ayuda="Se cuelga en vertical junto al titular. Sin imagen, la portada se queda solo con el texto."
      />

      <div className="mt-10 flex items-center gap-4">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
        {saved && (
          <p className="label inline-flex items-center gap-1.5 text-brand" role="status">
            <Check size={16} strokeWidth={2} aria-hidden="true" /> Guardado
          </p>
        )}
      </div>
    </form>
  )
}
