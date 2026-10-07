import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '@/hooks/useProducts'
import { descargar } from '@/lib/descarga'
import { mensajeDe } from '@/lib/errores'
import { fechaCorta, hoyEnLima, mesDe, nombreDelMes, periodoDelMes } from '@/lib/fechas'
import { formatSoles, formatTelefono } from '@/lib/format'
import { aDtoDeProducto } from '@/lib/productos'
import { productService, ventasService } from '@/services/servicios'
import { PAYMENT_METHOD_LABEL, SALE_STATUS_LABEL, type Sale, type SalesSummary, type SaleStatus } from '@/types/sale'

const soles = formatSoles

/**
 * Las ventas de un mes: lo vendido y lo que falta cobrar arriba, la lista con filtros, lo más
 * vendido y el archivo para Excel. Solo en el panel: nada de esto es público.
 */
export function VentasPage() {
  const [mes, setMes] = useState(() => mesDe(hoyEnLima()))
  const [estado, setEstado] = useState<SaleStatus | ''>('')
  const [busqueda, setBusqueda] = useState('')
  const [ventas, setVentas] = useState<Sale[]>([])
  const [resumen, setResumen] = useState<SalesSummary | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState<Sale | null>(null)
  const [liberar, setLiberar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const { products } = useProducts()

  /** Sube en cada cambio (un borrado) para volver a pedir el mes. */
  const [recarga, setRecarga] = useState(0)

  /*
   * Se pide el mes y su resumen a la vez. El estado solo cambia cuando llega la respuesta, y una
   * respuesta de un mes que ya no se mira (se cambió de mes antes de que llegara) se descarta.
   * El «cargando» se enciende en el evento que cambia de mes, no aquí.
   */
  useEffect(() => {
    let vigente = true
    Promise.all([ventasService.list(periodoDelMes(mes)), ventasService.resumen(mes)])
      .then(([lista, r]) => {
        if (!vigente) return
        setVentas(lista)
        setResumen(r)
        setError(null)
      })
      .catch((e: unknown) => vigente && setError(mensajeDe(e, 'No se pudieron cargar las ventas.')))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [mes, recarga])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const digitos = q.replace(/\D/g, '')
    return ventas.filter((v) =>
      (!estado || v.status === estado) &&
      (!q || v.customerName.toLowerCase().includes(q) || v.item.toLowerCase().includes(q) ||
        (digitos.length >= 3 && v.customerPhone.includes(digitos))))
  }, [ventas, estado, busqueda])

  // Al borrar la venta de una obra que está como vendida, se ofrece devolverla al catálogo.
  const obraDelPendiente = pendiente?.productId ? products.find((p) => p.id === pendiente.productId) ?? null : null
  const ofrecerLiberar = obraDelPendiente?.status === 'SOLD'

  async function confirmarBorrado() {
    if (!pendiente) return
    setBorrando(true)
    try {
      await ventasService.remove(pendiente.id)
      if (ofrecerLiberar && liberar && obraDelPendiente) {
        await productService.update(obraDelPendiente.id, { ...aDtoDeProducto(obraDelPendiente), status: 'AVAILABLE' })
      }
      setPendiente(null)
      setRecarga((n) => n + 1)
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo borrar la venta.'))
      setPendiente(null)
    } finally {
      setBorrando(false)
    }
  }

  function elegirMes(nuevo: string) {
    if (!nuevo || nuevo === mes) return
    setCargando(true)
    setMes(nuevo)
  }

  async function exportar() {
    setExportando(true)
    try {
      const periodo = periodoDelMes(mes)
      descargar(await ventasService.exportar(periodo), `ventas-${periodo.desde}-a-${periodo.hasta}.csv`)
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo preparar el archivo.'))
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-brand">Registro interno</p>
          <h1 className="text-h2 mt-2">Ventas</h1>
        </div>
        <Link to="/admin/ventas/nueva" className="btn-primary">
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" /> Registrar una venta
        </Link>
      </div>

      {/* El mes que se mira, y sus números. */}
      <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div>
          <label htmlFor="mes" className="field-label">Mes</label>
          <input id="mes" type="month" className="field-input tabular w-48" value={mes} max={mesDe(hoyEnLima())} onChange={(e) => elegirMes(e.target.value)} />
        </div>
        <button type="button" onClick={() => void exportar()} className="btn-secondary" disabled={exportando || cargando}>
          <Download size={18} strokeWidth={1.75} aria-hidden="true" /> {exportando ? 'Preparando…' : 'Exportar a Excel'}
        </button>
      </div>

      {resumen && (
        <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 border-t border-ink">
          <Cifra etiqueta={`Vendido en ${nombreDelMes(mes)}`} valor={soles(resumen.totalCents)} />
          <Cifra etiqueta="El mes anterior" valor={soles(resumen.previousMonthTotalCents)} />
          <Cifra etiqueta="Falta cobrar" valor={soles(resumen.pendingCents)} resaltar={resumen.pendingCents > 0} />
          <Cifra etiqueta="Ventas" valor={String(resumen.salesCount)} />
        </dl>
      )}

      {/* Filtros de la lista */}
      <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="grow sm:grow-0 sm:w-72">
          <label htmlFor="busqueda" className="field-label">Buscar</label>
          <input id="busqueda" type="search" className="field-input" placeholder="Cliente, teléfono u obra" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div>
          <label htmlFor="estado" className="field-label">Estado</label>
          <select id="estado" className="field-input w-48" value={estado} onChange={(e) => setEstado(e.target.value as SaleStatus | '')}>
            <option value="">Todos</option>
            {(Object.keys(SALE_STATUS_LABEL) as SaleStatus[]).map((s) => (
              <option key={s} value={s}>{SALE_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {cargando && ventas.length === 0 && <p className="label" role="status">Cargando…</p>}
        {error && <p role="alert" className="field-error">{error}</p>}

        {!cargando && !error && ventas.length === 0 && (
          <div className="border-t border-ink pt-8 max-w-md">
            <p className="font-display text-2xl">Sin ventas en {nombreDelMes(mes)}</p>
            <p className="mt-2 text-ink-soft">Cuando cierres una venta por WhatsApp, apúntala aquí con «Registrar una venta».</p>
          </div>
        )}

        {ventas.length > 0 && visibles.length === 0 && (
          <p className="border-t border-oat pt-6 text-ink-soft">Ninguna venta coincide con la búsqueda.</p>
        )}

        {visibles.length > 0 && (
          <div className="overflow-x-auto -mx-[var(--spacing-gutter)] px-[var(--spacing-gutter)]">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-y border-ink text-left">
                  <th scope="col" className="label py-3 pr-4 font-normal sticky left-0 bg-silk">Cliente</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Fecha</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Qué se vendió</th>
                  <th scope="col" className="label py-3 pr-4 font-normal text-right">Total</th>
                  <th scope="col" className="label py-3 pr-4 font-normal text-right">Falta</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Pago</th>
                  <th scope="col" className="label py-3 pr-4 font-normal">Estado</th>
                  <th scope="col" className="py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((v) => (
                  <tr key={v.id} className={`border-b border-oat ${v.status === 'CANCELLED' ? 'text-ink-soft' : ''}`}>
                    <td className="py-3 pr-4 sticky left-0 bg-silk">
                      <p className="font-semibold">{v.customerName}</p>
                      <p className="tabular text-ink-soft whitespace-nowrap">{formatTelefono(v.customerPhone)}</p>
                    </td>
                    <td className="py-3 pr-4 tabular whitespace-nowrap">{fechaCorta(v.saleDate)}</td>
                    <td className="py-3 pr-4">
                      <p>{v.item}{v.quantity > 1 && <span className="text-ink-soft"> × {v.quantity}</span>}</p>
                      {v.detail && <p className="text-ink-soft line-clamp-1 max-w-72">{v.detail}</p>}
                    </td>
                    <td className={`py-3 pr-4 tabular text-right ${v.status === 'CANCELLED' ? 'line-through' : ''}`}>{soles(v.totalCents)}</td>
                    <td className={`py-3 pr-4 tabular text-right ${v.balanceCents > 0 && v.status !== 'CANCELLED' ? 'text-brand font-semibold' : 'text-ink-soft'}`}>
                      {v.balanceCents > 0 ? soles(v.balanceCents) : 'Pagado'}
                    </td>
                    <td className="py-3 pr-4">{PAYMENT_METHOD_LABEL[v.paymentMethod]}</td>
                    <td className="py-3 pr-4">{SALE_STATUS_LABEL[v.status]}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/ventas/${v.id}`} className="btn-ghost size-11 px-0" aria-label={`Editar la venta a ${v.customerName}`}>
                          <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => { setLiberar(false); setPendiente(v) }}
                          className="btn-ghost size-11 px-0 hover:text-brand"
                          aria-label={`Borrar la venta a ${v.customerName}`}
                        >
                          <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resumen && resumen.topItems.length > 0 && (
        <section aria-labelledby="mas-vendido" className="mt-14 max-w-xl">
          <h2 id="mas-vendido" className="label">Lo más vendido en {nombreDelMes(mes)}</h2>
          <ol className="mt-3 border-t border-ink">
            {resumen.topItems.map((t) => (
              <li key={`${t.productId ?? ''}-${t.item}`} className="flex items-baseline justify-between gap-4 border-b border-oat py-3">
                <span>
                  {t.item}
                  {!t.productId && <span className="text-ink-soft"> (a medida)</span>}
                </span>
                <span className="tabular text-ink-soft whitespace-nowrap">{t.quantity} {t.quantity === 1 ? 'unidad' : 'unidades'}, {soles(t.totalCents)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Confirmación destructiva: inline, sin modal flotante, como en la lista de productos. */}
      {pendiente && (
        <div role="alertdialog" aria-labelledby="del-title" aria-describedby="del-desc" className="fixed inset-x-0 bottom-0 z-50 border-t border-ink bg-silk">
          <div className="container-x py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p id="del-title" className="font-semibold">¿Borrar la venta a {pendiente.customerName}?</p>
              <p id="del-desc" className="text-sm text-ink-soft">«{pendiente.item}», {soles(pendiente.totalCents)}. No se puede deshacer.</p>
              {ofrecerLiberar && obraDelPendiente && (
                <label className="mt-2 flex items-center gap-3 min-h-11 cursor-pointer text-sm">
                  <input type="checkbox" className="size-5 accent-brand" checked={liberar} onChange={(e) => setLiberar(e.target.checked)} />
                  Volver a poner «{obraDelPendiente.name}» como disponible
                </label>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPendiente(null)} className="btn-secondary" disabled={borrando}>
                Cancelar
              </button>
              <button type="button" onClick={() => void confirmarBorrado()} className="btn-primary disabled:opacity-50" disabled={borrando} autoFocus>
                {borrando ? 'Borrando…' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Cifra({ etiqueta, valor, resaltar = false }: { etiqueta: string; valor: string; resaltar?: boolean }) {
  return (
    <div className="border-b border-oat py-4 pr-4">
      <dt className="label">{etiqueta}</dt>
      <dd className={`mt-1 font-display text-2xl tabular ${resaltar ? 'text-brand' : ''}`}>{valor}</dd>
    </div>
  )
}
