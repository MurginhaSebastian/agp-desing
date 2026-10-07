import { useState, type FormEvent } from 'react'
import { aCentimos, aTextoDeSoles } from '@/lib/dinero'
import { erroresDeCampo, mensajeDe } from '@/lib/errores'
import { hoyEnLima } from '@/lib/fechas'
import { formatPrice, formatSoles } from '@/lib/format'
import type { Product } from '@/types/product'
import { PAYMENT_METHOD_LABEL, SALE_STATUS_LABEL, type PaymentMethod, type Sale, type SaleInput, type SaleStatus } from '@/types/sale'

interface Props {
  /** La venta que se edita; sin ella, una nueva. */
  venta?: Sale
  /** Las obras del catálogo, para elegir qué se vendió. */
  obras: Product[]
  /** Obra ya elegida al llegar desde la lista de productos («Registrar venta»). */
  obraInicial?: string | null
  submitLabel: string
  /**
   * `liberarObra`: la venta se cancela y su obra está como vendida; si el dueño lo marca, la obra
   * vuelve a «Disponible» después de guardar.
   */
  onSubmit: (input: SaleInput, opciones: { liberarObra: Product | null }) => Promise<void>
}

type Campo = keyof SaleInput | 'form'
type Errors = Partial<Record<Campo, string>>

function inicial(venta: Sale | undefined, obraInicial: string | null | undefined): SaleInput {
  if (venta) {
    return {
      productId: venta.productId, item: venta.item, detail: venta.detail, quantity: venta.quantity,
      totalCents: venta.totalCents, advanceCents: venta.advanceCents, paymentMethod: venta.paymentMethod,
      status: venta.status, customerName: venta.customerName, customerPhone: venta.customerPhone,
      saleDate: venta.saleDate, deliveryDate: venta.deliveryDate, markProductSold: false,
    }
  }
  return {
    productId: obraInicial ?? null, item: '', detail: '', quantity: 1, totalCents: 0, advanceCents: 0,
    paymentMethod: 'YAPE', status: 'PENDING', customerName: '', customerPhone: '', saleDate: hoyEnLima(),
    deliveryDate: null, markProductSold: false,
  }
}

/** Validación en cliente — el servidor (y el modo demo) repiten las mismas reglas. */
function validar(v: SaleInput, deCatalogo: boolean): Errors {
  const e: Errors = {}
  if (deCatalogo && !v.productId) e.productId = 'Elige la obra que se vendió.'
  if (!deCatalogo && v.item.trim().length < 2) e.item = 'Escribe qué se vendió.'
  if (!Number.isInteger(v.quantity) || v.quantity < 1 || v.quantity > 99) e.quantity = 'De 1 a 99.'
  if (!Number.isInteger(v.totalCents) || v.totalCents <= 0) e.totalCents = 'El total debe ser mayor que cero.'
  if (!Number.isInteger(v.advanceCents) || v.advanceCents < 0) e.advanceCents = 'Escribe cuánto adelantó (0 si nada).'
  else if (v.advanceCents > v.totalCents) e.advanceCents = 'El adelanto no puede ser mayor que el total.'
  if (v.customerName.trim().length < 2) e.customerName = 'Escribe el nombre del cliente.'
  const digitos = v.customerPhone.replace(/\D/g, '').length
  if (digitos < 9 || digitos > 15) e.customerPhone = 'Un teléfono de 9 a 15 dígitos.'
  if (!v.saleDate) e.saleDate = 'Indica la fecha de la venta.'
  if (v.deliveryDate && v.saleDate && v.deliveryDate < v.saleDate) e.deliveryDate = 'No puede ser antes de la venta.'
  return e
}

export function VentaForm({ venta, obras, obraInicial, submitLabel, onSubmit }: Props) {
  const [v, setV] = useState<SaleInput>(() => inicial(venta, obraInicial))
  // Una venta de una obra que luego se borró no tiene obra: se edita como encargo con su nombre.
  const [deCatalogo, setDeCatalogo] = useState(() => (venta ? venta.productId !== null : true))
  const [total, setTotal] = useState(() => (v.totalCents ? aTextoDeSoles(v.totalCents) : ''))
  const [adelanto, setAdelanto] = useState(() => (v.advanceCents ? aTextoDeSoles(v.advanceCents) : ''))
  const [liberar, setLiberar] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const obra = deCatalogo ? obras.find((o) => o.id === v.productId) ?? null : null
  const obrasOrdenadas = [...obras].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const totalCents = aCentimos(total)
  const adelantoCents = adelanto.trim() === '' ? 0 : aCentimos(adelanto)
  const saldo = Number.isFinite(totalCents) && Number.isFinite(adelantoCents) ? totalCents - adelantoCents : null
  // Cancelar una venta cuya obra está vendida: se ofrece devolverla al catálogo (no se hace sola,
  // pudo venderse por otro lado).
  const ofrecerLiberar = v.status === 'CANCELLED' && obra?.status === 'SOLD'

  function set<K extends keyof SaleInput>(key: K, value: SaleInput[K]) {
    setV((d) => ({ ...d, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: SaleInput = {
      ...v,
      productId: deCatalogo ? v.productId : null,
      item: deCatalogo ? '' : v.item,
      totalCents,
      advanceCents: adelantoCents,
      deliveryDate: v.deliveryDate || null,
      markProductSold: deCatalogo && v.markProductSold,
    }
    const errs = validar(next, deCatalogo)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setBusy(true)
    try {
      await onSubmit(next, { liberarObra: ofrecerLiberar && liberar ? obra : null })
    } catch (err) {
      const porCampo = erroresDeCampo(err)
      setErrors(Object.keys(porCampo).length > 0 ? (porCampo as Errors) : { form: mensajeDe(err, 'No se pudo guardar la venta.') })
    } finally {
      setBusy(false)
    }
  }

  const invalid = (k: Campo) => (errors[k] ? true : undefined)
  const error = (k: Campo, id: string) => errors[k] && <p id={id} className="field-error">{errors[k]}</p>

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7 space-y-10">
        <fieldset className="space-y-5">
          <legend className="label mb-2">Qué se vendió</legend>

          <div role="radiogroup" aria-label="Origen de la venta" className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2.5 min-h-11 cursor-pointer">
              <input type="radio" name="origen" className="size-4 accent-brand" checked={deCatalogo} onChange={() => setDeCatalogo(true)} />
              <span className="text-sm font-semibold">Una obra del catálogo</span>
            </label>
            <label className="flex items-center gap-2.5 min-h-11 cursor-pointer">
              <input type="radio" name="origen" className="size-4 accent-brand" checked={!deCatalogo} onChange={() => setDeCatalogo(false)} />
              <span className="text-sm font-semibold">Encargo a medida</span>
            </label>
          </div>

          {deCatalogo ? (
            <div>
              <label htmlFor="productId" className="field-label">Obra <span aria-hidden="true" className="text-brand">*</span></label>
              <select
                id="productId"
                className="field-input"
                value={v.productId ?? ''}
                aria-invalid={invalid('productId')}
                aria-describedby={errors.productId ? 'productId-err' : undefined}
                onChange={(e) => set('productId', e.target.value || null)}
              >
                <option value="">Elige una obra…</option>
                {obrasOrdenadas.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} — {formatPrice(o.priceCents, o.currency)}</option>
                ))}
              </select>
              {error('productId', 'productId-err')}
              {venta && venta.productId === v.productId && obra && venta.item !== obra.name && (
                <p className="mt-1.5 text-sm text-ink-soft">Se vendió como «{venta.item}»; ese nombre se conserva.</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="item" className="field-label">Qué se vendió <span aria-hidden="true" className="text-brand">*</span></label>
              <input id="item" className="field-input" value={v.item} maxLength={120} placeholder="Cuadro de la promoción 2010" aria-invalid={invalid('item')} aria-describedby={errors.item ? 'item-err' : undefined} onChange={(e) => set('item', e.target.value)} />
              {error('item', 'item-err')}
            </div>
          )}

          <div>
            <label htmlFor="detail" className="field-label">Detalle del encargo</label>
            <textarea id="detail" className="field-input min-h-28 py-2.5" rows={4} maxLength={2000} value={v.detail} aria-describedby="detail-help" onChange={(e) => set('detail', e.target.value)} />
            <p id="detail-help" className="mt-1.5 text-sm text-ink-soft">Lo que se personalizó: nombres, fechas, fotos, medidas. {v.detail.length}/2000</p>
          </div>

          <div className="max-w-40">
            <label htmlFor="quantity" className="field-label">Cantidad</label>
            <input id="quantity" type="number" inputMode="numeric" min={1} max={99} className="field-input tabular" value={v.quantity || ''} aria-invalid={invalid('quantity')} onChange={(e) => set('quantity', Number(e.target.value))} />
            {error('quantity', 'quantity-err')}
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="label mb-2">Cliente</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="customerName" className="field-label">Nombre <span aria-hidden="true" className="text-brand">*</span></label>
              <input id="customerName" className="field-input" autoComplete="off" maxLength={80} value={v.customerName} aria-invalid={invalid('customerName')} aria-describedby={errors.customerName ? 'customerName-err' : undefined} onChange={(e) => set('customerName', e.target.value)} />
              {error('customerName', 'customerName-err')}
            </div>
            <div>
              <label htmlFor="customerPhone" className="field-label">Teléfono <span aria-hidden="true" className="text-brand">*</span></label>
              <input id="customerPhone" type="tel" inputMode="tel" autoComplete="off" className="field-input tabular" maxLength={25} value={v.customerPhone} placeholder="987 654 321" aria-invalid={invalid('customerPhone')} aria-describedby={errors.customerPhone ? 'customerPhone-err' : undefined} onChange={(e) => set('customerPhone', e.target.value)} />
              {error('customerPhone', 'customerPhone-err')}
            </div>
          </div>
        </fieldset>
      </div>

      <fieldset className="lg:col-span-4 lg:col-start-9 space-y-5">
        <legend className="label mb-2">Cobro y entrega</legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="total" className="field-label">Total (S/) <span aria-hidden="true" className="text-brand">*</span></label>
            <input id="total" type="text" inputMode="decimal" className="field-input tabular" value={total} aria-invalid={invalid('totalCents')} aria-describedby={errors.totalCents ? 'total-err' : undefined} onChange={(e) => setTotal(e.target.value)} />
            {error('totalCents', 'total-err')}
          </div>
          <div>
            <label htmlFor="advance" className="field-label">Adelanto (S/)</label>
            <input id="advance" type="text" inputMode="decimal" className="field-input tabular" value={adelanto} placeholder="0" aria-invalid={invalid('advanceCents')} aria-describedby={errors.advanceCents ? 'advance-err' : undefined} onChange={(e) => setAdelanto(e.target.value)} />
            {error('advanceCents', 'advance-err')}
          </div>
        </div>

        <p className="flex items-baseline justify-between border-y border-oat py-3" aria-live="polite">
          <span className="label">Falta cobrar</span>
          <span className={`tabular font-semibold ${saldo !== null && saldo > 0 ? 'text-brand' : ''}`}>
            {saldo === null || totalCents <= 0 ? '—' : formatSoles(Math.max(saldo, 0))}
          </span>
        </p>

        <div>
          <label htmlFor="paymentMethod" className="field-label">Cómo paga</label>
          <select id="paymentMethod" className="field-input" value={v.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)}>
            {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="field-label">Estado</label>
          <select id="status" className="field-input" value={v.status} onChange={(e) => set('status', e.target.value as SaleStatus)}>
            {(Object.keys(SALE_STATUS_LABEL) as SaleStatus[]).map((s) => (
              <option key={s} value={s}>{SALE_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="saleDate" className="field-label">Fecha de venta</label>
            <input id="saleDate" type="date" className="field-input tabular" value={v.saleDate} aria-invalid={invalid('saleDate')} onChange={(e) => set('saleDate', e.target.value)} />
            {error('saleDate', 'saleDate-err')}
          </div>
          <div>
            <label htmlFor="deliveryDate" className="field-label">Entrega</label>
            <input id="deliveryDate" type="date" className="field-input tabular" value={v.deliveryDate ?? ''} min={v.saleDate || undefined} aria-invalid={invalid('deliveryDate')} aria-describedby={errors.deliveryDate ? 'deliveryDate-err' : undefined} onChange={(e) => set('deliveryDate', e.target.value || null)} />
            {error('deliveryDate', 'deliveryDate-err')}
          </div>
        </div>

        {obra && obra.status !== 'SOLD' && (
          <label className="flex items-start gap-3 min-h-11 cursor-pointer">
            <input type="checkbox" className="mt-0.5 size-5 accent-brand" checked={v.markProductSold} onChange={(e) => set('markProductSold', e.target.checked)} />
            <span className="text-sm">
              <span className="font-semibold">Marcar la obra como vendida en el catálogo</span>
              <span className="block text-ink-soft">Para piezas únicas. Si es un modelo que haces muchas veces, déjalo sin marcar.</span>
            </span>
          </label>
        )}

        {ofrecerLiberar && (
          <label className="flex items-start gap-3 min-h-11 cursor-pointer">
            <input type="checkbox" className="mt-0.5 size-5 accent-brand" checked={liberar} onChange={(e) => setLiberar(e.target.checked)} />
            <span className="text-sm">
              <span className="font-semibold">Volver a poner «{obra.name}» como disponible</span>
              <span className="block text-ink-soft">Ahora sale como vendida en la web.</span>
            </span>
          </label>
        )}

        {errors.form && <p role="alert" className="field-error">{errors.form}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? 'Guardando…' : submitLabel}
        </button>
      </fieldset>
    </form>
  )
}
