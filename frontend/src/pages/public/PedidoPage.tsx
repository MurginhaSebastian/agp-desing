import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Conversar } from '@/components/ui/iconos'
import { Reveal } from '@/components/ui/Reveal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useRecurso } from '@/hooks/useRecurso'
import { useSeo } from '@/hooks/useSeo'
import {
  OCASIONES,
  PEDIDO_VACIO,
  PIEZAS,
  TAMANOS,
  enlaceDePedido,
  faltan,
  mensajeDePedido,
  type Entrega,
  type Pedido,
} from '@/lib/pedido'
import { productService } from '@/services/servicios'

type Respuestas = Omit<Pedido, 'obra'>

/** Hoy en AAAA-MM-DD y en hora local: es el mínimo del calendario. */
function hoy(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * «Arma tu pedido». El cliente responde lo que sepa y al final se abre WhatsApp con el pedido
 * ya escrito: no hay carrito ni se guarda nada, la venta se cierra en el chat. A la derecha,
 * una nota de encargo enseña el mensaje tal como va a llegar, mientras se rellena.
 *
 * Desde una ficha se llega con `?obra=<slug>` y el pedido parte de esa obra.
 */
export function PedidoPage() {
  usePageTitle('Arma tu pedido — AGP Desing')
  useSeo({
    description:
      'Cuéntanos la ocasión, la pieza y cómo la quieres. Se abre WhatsApp con tu pedido escrito y lo terminamos de diseñar contigo.',
  })

  const [params] = useSearchParams()
  const slug = params.get('obra')
  const { dato: obraCargada, estado: estadoObra } = useRecurso(slug, productService.getBySlug)
  const [obraQuitada, setObraQuitada] = useState(false)
  const obra =
    !obraQuitada && slug && estadoObra === 'ok' && obraCargada ? { name: obraCargada.name, slug: obraCargada.slug } : null

  const [r, setR] = useState<Respuestas>(PEDIDO_VACIO)
  const [intentado, setIntentado] = useState(false)
  const formulario = useRef<HTMLFormElement>(null)

  const pedido: Pedido = { ...r, obra }
  const pendientes = faltan(pedido)
  const conTamano = r.pieza !== 'Box temático'
  const origen = window.location.origin

  const poner = <K extends keyof Respuestas>(clave: K, valor: Respuestas[K]) => setR((prev) => ({ ...prev, [clave]: valor }))

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (pendientes.length > 0) {
      setIntentado(true)
      // Lleva al primer grupo sin responder, a su primera opción.
      formulario.current?.querySelector<HTMLInputElement>(`input[name="${pendientes[0]}"]`)?.focus()
      return
    }
    window.open(enlaceDePedido(pedido, origen), '_blank', 'noopener,noreferrer')
  }

  // Los pasos se numeran según los que se ven: sin tamaño (un box), el resto sube un número.
  let n = 0
  const numero = () => String(++n).padStart(2, '0')

  return (
    <div className="container-x pt-12 pb-24 md:pt-20 md:pb-32">
      <Reveal>
        <h1 className="text-display">Arma tu pedido.</h1>
        <p className="text-lead mt-6 max-w-[44ch] text-ink-soft">
          Responde lo que sepas. Al final se abre WhatsApp con tu pedido ya escrito y lo terminamos de
          diseñar contigo.
        </p>
      </Reveal>

      <form
        ref={formulario}
        onSubmit={enviar}
        noValidate
        className="mt-14 lg:mt-20 grid gap-12 lg:grid-cols-12 lg:gap-10 lg:items-start"
      >
        <div className="lg:col-span-7 relative paspartu capa-2 px-5 pt-10 pb-12 sm:px-8 md:px-12 md:pt-12 md:pb-14">
          <p className="pestana absolute bottom-full left-5 sm:left-8 md:left-12">Tu pedido</p>

          <div className="space-y-12">
            <Paso numero={numero()} titulo="¿Para qué ocasión es?" error={intentado && pendientes.includes('ocasion') ? 'Elige una ocasión.' : null}>
              <Opciones nombre="ocasion" opciones={OCASIONES} valor={r.ocasion} onChange={(v) => poner('ocasion', v)} />
            </Paso>

            <Paso numero={numero()} titulo="¿Qué pieza quieres?" error={intentado && pendientes.includes('pieza') ? 'Elige una pieza.' : null}>
              <Opciones nombre="pieza" opciones={PIEZAS} valor={r.pieza} onChange={(v) => poner('pieza', v)} />
              <div className="mt-6 text-[0.9375rem]">
                {obra ? (
                  <p className="text-ink-soft">
                    A partir de <span className="font-semibold text-ink">«{obra.name}»</span>.{' '}
                    <button type="button" onClick={() => setObraQuitada(true)} className="enlace-flecha min-h-11">
                      Mejor desde cero
                    </button>
                  </p>
                ) : (
                  <p className="text-ink-soft">
                    Diseño desde cero. Si te gustó una pieza,{' '}
                    <Link to="/catalogo" className="enlace-flecha min-h-11">
                      elígela en el catálogo
                    </Link>{' '}
                    y pulsa «Personalizar este diseño».
                  </p>
                )}
              </div>
            </Paso>

            {conTamano && (
              <Paso numero={numero()} titulo="¿De qué tamaño, más o menos?">
                <Opciones nombre="tamano" opciones={TAMANOS} valor={r.tamano} onChange={(v) => poner('tamano', v)} />
              </Paso>
            )}

            <Paso numero={numero()} titulo="¿Cómo la quieres?">
              <div className="space-y-6">
                <div>
                  <label htmlFor="pedido-texto" className="nota block mb-2">
                    Nombres, fechas o frases que van en la pieza
                  </label>
                  <input
                    id="pedido-texto"
                    className="campo"
                    value={r.texto}
                    onChange={(e) => poner('texto', e.target.value)}
                    placeholder="Ana y Luis, 14 de febrero de 2020"
                    maxLength={160}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="pedido-idea" className="nota block mb-2">
                    Cuéntanos la idea: colores, estilo, a quién va dirigida
                  </label>
                  <textarea
                    id="pedido-idea"
                    className="campo"
                    value={r.idea}
                    onChange={(e) => poner('idea', e.target.value)}
                    maxLength={600}
                  />
                </div>
              </div>
            </Paso>

            <Paso numero={numero()} titulo="¿Dónde y para cuándo?">
              <Opciones<Entrega>
                nombre="entrega"
                opciones={['trujillo', 'provincia']}
                etiqueta={(v) => (v === 'trujillo' ? 'En Trujillo' : 'Envío a otra provincia')}
                valor={r.entrega}
                onChange={(v) => poner('entrega', v)}
              />
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {r.entrega === 'provincia' && (
                  <div>
                    <label htmlFor="pedido-ciudad" className="nota block mb-2">
                      Ciudad
                    </label>
                    <input
                      id="pedido-ciudad"
                      className="campo"
                      value={r.ciudad}
                      onChange={(e) => poner('ciudad', e.target.value)}
                      maxLength={60}
                      autoComplete="address-level2"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="pedido-fecha" className="nota block mb-2">
                    ¿Para qué fecha? (opcional)
                  </label>
                  <input
                    id="pedido-fecha"
                    type="date"
                    className="campo"
                    value={r.fecha}
                    min={hoy()}
                    onChange={(e) => poner('fecha', e.target.value)}
                  />
                </div>
              </div>
            </Paso>
          </div>
        </div>

        {/* La nota de encargo: el mensaje tal como va a llegar, escrito mientras se rellena. */}
        <aside aria-labelledby="nota-title" className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="papel capa-3 px-6 pt-7 pb-8 md:px-8 md:pt-8">
            <h2 id="nota-title" className="text-h3">Así nos llegará</h2>
            <p className="whitespace-pre-line mt-5 border-t border-oat pt-5 text-[0.9375rem] leading-relaxed text-ink-soft break-words">
              {mensajeDePedido(pedido, origen)}
            </p>

            {intentado && pendientes.length > 0 && (
              <p role="alert" className="mt-6 text-[0.9375rem] font-semibold text-brand">
                Falta {pendientes.length === 2 ? 'la ocasión y la pieza' : pendientes[0] === 'ocasion' ? 'la ocasión' : 'la pieza'}.
              </p>
            )}

            <button type="submit" className="boton w-full mt-8">
              <Conversar size={18} />
              Enviar por WhatsApp
            </button>
            <p className="mt-4 text-sm text-ink-soft">
              No se guarda nada en la web: el mensaje sale solo cuando lo envías tú. Las fotos de referencia
              nos las mandas en el mismo chat.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

function Paso({ numero, titulo, error = null, children }: { numero: string; titulo: string; error?: string | null; children: ReactNode }) {
  const idError = `error-${numero}`
  return (
    <fieldset aria-describedby={error ? idError : undefined}>
      <legend className="flex items-baseline gap-4">
        <span className="font-display text-3xl leading-none text-brand tabular" aria-hidden="true">
          {numero}
        </span>
        <span className="font-display text-h3">{titulo}</span>
      </legend>
      {error && (
        <p id={idError} className="mt-3 text-[0.9375rem] font-semibold text-brand">
          {error}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </fieldset>
  )
}

function Opciones<T extends string>({
  nombre,
  opciones,
  valor,
  onChange,
  etiqueta = (v) => v,
}: {
  nombre: string
  opciones: readonly T[]
  valor: string
  onChange: (v: T) => void
  etiqueta?: (v: T) => string
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {opciones.map((o) => (
        <label key={o} className="opcion">
          <input type="radio" name={nombre} value={o} checked={valor === o} onChange={() => onChange(o)} className="sr-only" />
          {etiqueta(o)}
        </label>
      ))}
    </div>
  )
}
