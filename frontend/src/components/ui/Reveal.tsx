import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** retraso en ms — para escalonar hermanos (30–80ms entre cada uno) */
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'figure' | 'article'
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const

/**
 * Revelado al hacer scroll — superficie de marketing, por eso puede durar 600ms.
 * Se dispara una sola vez. Con reduced-motion se conserva la opacidad y se
 * elimina el desplazamiento: más suave, no cero.
 */
export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, transform: reduce ? 'translateY(0px)' : 'translateY(18px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduce ? 0.25 : 0.6, ease: EASE_OUT, delay: delay / 1000 }}
    >
      {children}
    </Tag>
  )
}
