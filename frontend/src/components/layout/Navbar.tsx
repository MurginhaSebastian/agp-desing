import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const links = [
  { to: '/#sobre', label: 'Sobre AGP' },
  { to: '/#como-funciona', label: 'Cómo funciona' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/#faq', label: 'Preguntas frecuentes' },
  { to: '/#contacto', label: 'Contacto' },
]

const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

export function Navbar() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  /** Cerrar sin navegar: el foco vuelve al botón que abrió el menú. */
  const dismiss = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  // Bloquear scroll del fondo mientras el menú está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // El panel tapa la página: con el teclado hay que poder salir con Escape y
  // empezar dentro del menú, no detrás de él.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector<HTMLElement>('a')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 bg-silk/90 backdrop-blur-sm border-b border-oat">
      <nav aria-label="Principal" className="container-x flex items-center justify-between h-16 md:h-20">
        <Wordmark />

        <ul className="hidden md:flex items-center gap-5 lg:gap-7">
          {links.map((l) => (
            <li key={l.to}>
              <NavItem to={l.to}>{l.label}</NavItem>
            </li>
          ))}
          <li>
            <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-11 px-5">
              Cotizar
            </a>
          </li>
        </ul>

        <button
          ref={toggleRef}
          type="button"
          className="md:hidden inline-flex items-center justify-center size-11 -mr-2 text-ink"
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} strokeWidth={1.75} /> : <Menu size={24} strokeWidth={1.75} />}
        </button>
      </nav>

      {/*
       * El header lleva backdrop-blur y eso lo convierte en el marco de referencia de
       * todo lo que tenga dentro con position:fixed: el panel se medía contra los 64 px
       * de la cabecera y salía con altura cero, transparente. Con el portal cuelga del
       * body y vuelve a ocupar la pantalla. El portal envuelve a AnimatePresence, no al
       * revés: al revés no llega a montar nada.
       */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                aria-hidden="true"
                className="fixed inset-0 top-16 z-30 bg-bordeaux/40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE_DRAWER }}
                onClick={dismiss}
              />
              <motion.div
                ref={panelRef}
                id="menu-movil"
                role="dialog"
                aria-modal="true"
                aria-label="Menú"
                className="fixed top-16 right-0 bottom-0 z-40 w-[min(85vw,22rem)] bg-silk border-l border-oat md:hidden"
                initial={{ transform: 'translateX(100%)' }}
                animate={{ transform: 'translateX(0%)' }}
                exit={{ transform: 'translateX(100%)', transition: { duration: 0.2, ease: EASE_DRAWER } }}
                transition={{ duration: 0.28, ease: EASE_DRAWER }}
              >
                <ul className="flex flex-col py-4">
                  {links.map((l, i) => (
                    <motion.li
                      key={l.to}
                      initial={{ opacity: 0, transform: 'translateX(12px)' }}
                      animate={{ opacity: 1, transform: 'translateX(0px)' }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.06 + i * 0.04 }}
                    >
                      <Link
                        to={l.to}
                        onClick={close}
                        className="flex items-center min-h-12 px-6 font-display text-2xl text-ink"
                      >
                        {l.label}
                      </Link>
                    </motion.li>
                  ))}
                  <li className="px-6 pt-4">
                    <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                      Cotizar por WhatsApp
                    </a>
                  </li>
                </ul>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  )
}

function NavItem({ to, children }: { to: string; children: string }) {
  const isHash = to.includes('#')
  const className = 'link-underline inline-flex items-center min-h-11 font-body text-[0.9375rem] font-medium text-ink'
  if (isHash) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <NavLink to={to} className={({ isActive }) => `${className} ${isActive ? 'text-brand' : ''}`}>
      {children}
    </NavLink>
  )
}
