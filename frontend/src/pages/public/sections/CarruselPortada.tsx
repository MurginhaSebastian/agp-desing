import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { FlechaDerecha, FlechaIzquierda, Pausa, Seguir } from '@/components/ui/iconos'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
/** Cuánto se queda cada foto antes de pasar a la siguiente. */
const ESPERA_MS = 5000
/**
 * Un deslizamiento cambia de foto si recorre 40 px, o si es un golpe rápido de al menos 16 px
 * (más de 0,11 px/ms): con un gesto corto y decidido también tiene que bastar.
 */
const DESLIZ_PX = 40
const GOLPE_PX = 16
const GOLPE_VELOCIDAD = 0.11
/** Desplazamiento lateral de la foto al cambiarla a mano: entra por el lado hacia el que se va. */
const LADO_PX = 24
/** Mismas funciones en todos los estados, para que Motion pueda interpolar entre ellos. */
const REPOSO = 'translateX(0px) scale(1)'

interface Cambio {
  /** 1 hacia la siguiente, -1 hacia la anterior. */
  dir: number
  /** Si lo pidió la persona (botón o dedo) o lo hizo el carrusel solo. */
  manual: boolean
}

interface Props {
  fotos: string[]
  cargando: boolean
}

/**
 * Las fotos de la caja de la portada, una tras otra, montadas sobre el paspartú.
 *
 * - Pulsar la foto lleva al catálogo: es lo que se espera de una obra que se ve en portada.
 *   El enlace no entra en el orden del tabulador ni lo anuncian los lectores de pantalla,
 *   porque justo al lado está el botón «Ver el catálogo» que hace lo mismo (igual que la foto
 *   de las tarjetas del catálogo).
 * - Pasa sola cada 5 s, y se para al pasar el ratón, al llegar con el teclado a los controles
 *   o con el botón de pausa (WCAG 2.2.2: lo que se mueve solo tiene que poder pararse). Con
 *   reduced-motion no pasa sola.
 * - En el móvil se desliza con el dedo (también vale un golpe corto y rápido); un deslizamiento
 *   no cuenta como toque. Fuera de la pantalla no pasa sola.
 * - Solo se monta la foto visible (y la que sale); la siguiente se precarga para que el cambio
 *   no espere a la red. Las fotos no se recortan: `object-contain` sobre un escenario cuadrado.
 */
export function CarruselPortada({ fotos, cargando }: Props) {
  const reduce = useReducedMotion()
  const [indice, setIndice] = useState(0)
  const [cambio, setCambio] = useState<Cambio>({ dir: 1, manual: false })
  const [enPausa, setEnPausa] = useState(false)
  const [encima, setEncima] = useState(false)
  const inicioDesliz = useRef<{ x: number; t: number } | null>(null)
  const deslizado = useRef(false)
  // Fuera de la pantalla no pasa: ni gasta trabajo ni descarga fotos que nadie está mirando.
  const caja = useRef<HTMLDivElement>(null)
  const enVista = useInView(caja, { amount: 0.3 })

  const n = fotos.length
  const actual = n > 0 ? indice % n : 0
  const pasaSola = n > 1 && enVista && !enPausa && !encima && reduce !== true
  const ir = (paso: number) => {
    setCambio({ dir: Math.sign(paso), manual: true })
    setIndice((i) => (((i % n) + paso) % n + n) % n)
  }

  // Un temporizador por foto: al cambiarla a mano, la cuenta vuelve a empezar.
  useEffect(() => {
    if (!pasaSola) return
    const t = window.setTimeout(() => {
      setCambio({ dir: 1, manual: false })
      setIndice((i) => (i + 1) % n)
    }, ESPERA_MS)
    return () => window.clearTimeout(t)
  }, [pasaSola, actual, n])

  // La siguiente foto, ya descargada cuando le toque.
  useEffect(() => {
    if (n < 2) return
    const img = new Image()
    img.src = fotos[(actual + 1) % n]
  }, [actual, n, fotos])

  const alTocar = (e: PointerEvent) => {
    if (!e.isPrimary) return // un segundo dedo no empieza otro gesto
    inicioDesliz.current = { x: e.clientX, t: performance.now() }
    deslizado.current = false
    // El gesto sigue siendo de la foto aunque el dedo o el ratón salgan de ella.
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const alSoltar = (e: PointerEvent) => {
    if (inicioDesliz.current === null || n < 2) return
    const dx = e.clientX - inicioDesliz.current.x
    const velocidad = Math.abs(dx) / Math.max(1, performance.now() - inicioDesliz.current.t)
    inicioDesliz.current = null
    if (Math.abs(dx) >= DESLIZ_PX || (Math.abs(dx) >= GOLPE_PX && velocidad > GOLPE_VELOCIDAD)) {
      deslizado.current = true
      ir(dx < 0 ? 1 : -1)
    }
  }
  const alPulsar = (e: MouseEvent) => {
    if (deslizado.current) e.preventDefault()
    deslizado.current = false
  }

  return (
    // La caja existe siempre, también mientras llegan las fotos: `useInView` se engancha a ella
    // al montarse y no vería una que apareciera después (el carrusel no llegaba a pasar solo).
    <div
      ref={caja}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setEncima(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setEncima(false)}
    >
      {n === 0 ? (
        <span aria-hidden="true" className={`block aspect-square ${cargando ? 'esqueleto' : 'border border-greige/60'}`} />
      ) : (
        <>
          <Link
            to="/catalogo"
            tabIndex={-1}
            aria-hidden="true"
            draggable={false}
            onPointerDown={alTocar}
            onPointerUp={alSoltar}
            onPointerCancel={() => (inicioDesliz.current = null)}
            onClick={alPulsar}
            className="relative block aspect-square overflow-hidden touch-pan-y select-none"
          >
            {/*
              Dos ritmos. Cuando pasa sola es la portada luciéndose: fundido lento (700 ms), la foto
              nueva posándose sobre el paspartú. Cuando la pide la persona es una respuesta: rápida
              (260 ms entrar, 180 salir) y con dirección, entra por el lado hacia el que se va, para
              que «siguiente» y «anterior» se sientan como pasar hojas. `custom` llega también a la
              foto que sale, que así sabe hacia dónde irse.
            */}
            <AnimatePresence initial={false} custom={cambio}>
              <motion.img
                key={fotos[actual]}
                src={fotos[actual]}
                alt=""
                draggable={false}
                decoding="async"
                fetchPriority={actual === 0 ? 'high' : 'auto'}
                className="absolute inset-0 size-full object-contain"
                custom={cambio}
                variants={{
                  entra: (c: Cambio) => ({
                    opacity: 0,
                    transform: reduce ? REPOSO : c.manual ? `translateX(${c.dir * LADO_PX}px) scale(1)` : 'translateX(0px) scale(0.985)',
                  }),
                  quieta: (c: Cambio) => ({
                    opacity: 1,
                    transform: REPOSO,
                    transition: { duration: reduce ? 0.2 : c.manual ? 0.26 : 0.7, ease: EASE_OUT },
                  }),
                  sale: (c: Cambio) => ({
                    opacity: 0,
                    transform: reduce || !c.manual ? REPOSO : `translateX(${-c.dir * LADO_PX}px) scale(1)`,
                    transition: { duration: reduce ? 0.15 : c.manual ? 0.18 : 0.45, ease: EASE_OUT },
                  }),
                }}
                initial="entra"
                animate="quieta"
                exit="sale"
              />
            </AnimatePresence>
          </Link>

          {n > 1 && (
            /* Anotados a lápiz en el margen de abajo del paspartú, como el número de las obras. */
            <div
              role="group"
              aria-label="Fotos de la portada"
              onFocus={() => setEncima(true)}
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setEncima(false)}
              className="absolute right-3 bottom-1.5 sm:right-5 sm:bottom-2.5 flex items-center"
            >
              <button type="button" onClick={() => ir(-1)} aria-label="Foto anterior" className="control-carrusel">
                <FlechaIzquierda size={18} />
              </button>
              <span aria-hidden="true" className="min-w-[3.25rem] text-center font-display text-[0.9375rem] text-ink-soft tabular">
                {String(actual + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </span>
              <button type="button" onClick={() => ir(1)} aria-label="Foto siguiente" className="control-carrusel">
                <FlechaDerecha size={18} />
              </button>
              {reduce !== true && (
                <button
                  type="button"
                  onClick={() => setEnPausa((p) => !p)}
                  aria-label={enPausa ? 'Seguir pasando las fotos' : 'Pausar las fotos'}
                  className="control-carrusel ml-1"
                >
                  {enPausa ? <Seguir size={16} /> : <Pausa size={16} />}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
