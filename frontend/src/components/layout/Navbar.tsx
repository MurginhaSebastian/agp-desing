import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const links = [
  { to: '/#sobre', label: 'Sobre AGP' },
  { to: '/#como-funciona', label: 'Cómo funciona' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/#contacto', label: 'Contacto' },
]

const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Cerrar el menú al navegar y bloquear scroll del fondo mientras está abierto
  useEffect(() => setOpen(false), [location])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 bg-silk/90 backdrop-blur-sm border-b border-oat">
      <nav aria-label="Principal" className="container-x flex items-center justify-between h-16 md:h-20">
        <Wordmark />

        <ul className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <li key={l.to}>
              <NavItem to={l.to}>{l.label}</NavItem>
            </li>
          ))}
          <li>
            <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-10 px-5">
              Cotizar
            </a>
          </li>
        </ul>

        <button
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

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="fixed inset-0 top-16 z-30 bg-bordeaux/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_DRAWER }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="menu-movil"
              className="fixed top-16 right-0 bottom-0 z-40 w-[min(85vw,22rem)] bg-silk border-l border-oat md:hidden"
              initial={{ transform: 'translateX(100%)' }}
              animate={{ transform: 'translateX(0%)' }}
              exit={{ transform: 'translateX(100%)' }}
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
      </AnimatePresence>
    </header>
  )
}

function NavItem({ to, children }: { to: string; children: string }) {
  const isHash = to.includes('#')
  const className = 'link-underline font-body text-[0.9375rem] font-medium text-ink py-2'
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
