import { useState, type FormEvent } from 'react'
import { ApiError } from '@/types/api'
import type { Currency, ProductCreateDTO, ProductStatus } from '@/types/product'
import { PRODUCT_STATUS_LABEL } from '@/types/product'

interface Props {
  initial?: ProductCreateDTO
  submitLabel: string
  onSubmit: (dto: ProductCreateDTO) => Promise<void>
}

type Errors = Partial<Record<keyof ProductCreateDTO | 'form', string>>

const empty: ProductCreateDTO = {
  name: '',
  description: '',
  priceCents: 0,
  currency: 'PEN',
  widthCm: 0,
  heightCm: 0,
  technique: '',
  imageUrl: '',
  status: 'AVAILABLE',
  featured: false,
}

/** Validación en cliente — el backend repite las mismas reglas con @Valid. */
function validate(dto: ProductCreateDTO): Errors {
  const e: Errors = {}
  if (dto.name.trim().length < 2) e.name = 'Escribe el nombre del producto (mínimo 2 caracteres).'
  if (dto.name.length > 120) e.name = 'Máximo 120 caracteres.'
  if (dto.description.length > 2000) e.description = 'Máximo 2000 caracteres.'
  if (!Number.isInteger(dto.priceCents) || dto.priceCents <= 0) e.priceCents = 'El precio debe ser mayor que cero.'
  if (dto.widthCm <= 0) e.widthCm = 'Ancho en cm, mayor que cero.'
  if (dto.heightCm <= 0) e.heightCm = 'Alto en cm, mayor que cero.'
  if (dto.technique.trim().length === 0) e.technique = 'Indica el formato (ej. Cuadro 3D o Box Temático).'
  if (!/^(https?:\/\/|\/)/.test(dto.imageUrl)) e.imageUrl = 'Debe ser una URL (https://…) o una ruta que empiece por /.'
  return e
}

export function ProductForm({ initial = empty, submitLabel, onSubmit }: Props) {
  const [dto, setDto] = useState<ProductCreateDTO>(initial)
  const [price, setPrice] = useState(initial.priceCents ? String(initial.priceCents / 100) : '')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  function set<K extends keyof ProductCreateDTO>(key: K, value: ProductCreateDTO[K]) {
    setDto((d) => ({ ...d, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = { ...dto, priceCents: Math.round(Number(price.replace(/[^\d.]/g, '')) * 100) }
    const errs = validate(next)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      first?.focus()
      return
    }
    setBusy(true)
    try {
      await onSubmit(next)
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors as Errors)
      } else {
        setErrors({ form: err instanceof Error ? err.message : 'No se pudo guardar.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const invalid = (k: keyof Errors) => (errors[k] ? true : undefined)

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-12">
      <fieldset className="lg:col-span-7 space-y-5">
        <legend className="label mb-2">Producto</legend>

        <div>
          <label htmlFor="name" className="field-label">Nombre <span aria-hidden="true" className="text-brand">*</span></label>
          <input id="name" className="field-input" value={dto.name} maxLength={120} required aria-invalid={invalid('name')} aria-describedby={errors.name ? 'name-err' : undefined} onChange={(e) => set('name', e.target.value)} />
          {errors.name && <p id="name-err" className="field-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="description" className="field-label">Descripción</label>
          <textarea id="description" className="field-input min-h-32 py-2.5" value={dto.description} maxLength={2000} rows={5} aria-invalid={invalid('description')} aria-describedby="description-help" onChange={(e) => set('description', e.target.value)} />
          <p id="description-help" className="mt-1.5 text-sm text-ink-soft">Texto plano. Se muestra en la ficha del producto. {dto.description.length}/2000</p>
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="technique" className="field-label">Formato <span aria-hidden="true" className="text-brand">*</span></label>
          <input id="technique" className="field-input" value={dto.technique} placeholder="Cuadro 3D o Box Temático" required aria-invalid={invalid('technique')} onChange={(e) => set('technique', e.target.value)} />
          {errors.technique && <p className="field-error">{errors.technique}</p>}
        </div>

        <div>
          <label htmlFor="imageUrl" className="field-label">Imagen (URL) <span aria-hidden="true" className="text-brand">*</span></label>
          <input id="imageUrl" type="url" className="field-input" value={dto.imageUrl} required aria-invalid={invalid('imageUrl')} aria-describedby="imageUrl-help" onChange={(e) => set('imageUrl', e.target.value)} />
          <p id="imageUrl-help" className="mt-1.5 text-sm text-ink-soft">Sube la foto a Cloudinary o similar y pega aquí el enlace.</p>
          {errors.imageUrl && <p className="field-error">{errors.imageUrl}</p>}
        </div>
      </fieldset>

      <fieldset className="lg:col-span-4 lg:col-start-9 space-y-5">
        <legend className="label mb-2">Ficha</legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="widthCm" className="field-label">Ancho (cm) <span aria-hidden="true" className="text-brand">*</span></label>
            <input id="widthCm" type="number" inputMode="numeric" min={1} className="field-input tabular" value={dto.widthCm || ''} required aria-invalid={invalid('widthCm')} onChange={(e) => set('widthCm', Number(e.target.value))} />
            {errors.widthCm && <p className="field-error">{errors.widthCm}</p>}
          </div>
          <div>
            <label htmlFor="heightCm" className="field-label">Alto (cm) <span aria-hidden="true" className="text-brand">*</span></label>
            <input id="heightCm" type="number" inputMode="numeric" min={1} className="field-input tabular" value={dto.heightCm || ''} required aria-invalid={invalid('heightCm')} onChange={(e) => set('heightCm', Number(e.target.value))} />
            {errors.heightCm && <p className="field-error">{errors.heightCm}</p>}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-4">
          <div>
            <label htmlFor="price" className="field-label">Precio <span aria-hidden="true" className="text-brand">*</span></label>
            <input id="price" type="text" inputMode="decimal" className="field-input tabular" value={price} required aria-invalid={invalid('priceCents')} onChange={(e) => setPrice(e.target.value)} />
            {errors.priceCents && <p className="field-error">{errors.priceCents}</p>}
          </div>
          <div>
            <label htmlFor="currency" className="field-label">Moneda</label>
            <select id="currency" className="field-input" value={dto.currency} onChange={(e) => set('currency', e.target.value as Currency)}>
              <option value="PEN">PEN (soles)</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="status" className="field-label">Estado</label>
          <select id="status" className="field-input" value={dto.status} onChange={(e) => set('status', e.target.value as ProductStatus)}>
            {(Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map((s) => (
              <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 min-h-11 cursor-pointer">
          <input type="checkbox" className="size-5 accent-brand" checked={dto.featured} onChange={(e) => set('featured', e.target.checked)} />
          <span className="text-sm font-semibold">Mostrar en portada</span>
        </label>

        {errors.form && <p role="alert" className="field-error">{errors.form}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? 'Guardando…' : submitLabel}
        </button>
      </fieldset>
    </form>
  )
}
