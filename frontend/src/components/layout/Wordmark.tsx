import { Link } from 'react-router-dom'

/**
 * Marca tipográfica: "AGP" en sans compacta + "Desing" en serif itálica,
 * el mismo contraste del logotipo oficial. Cuando el cliente entregue el
 * logo con fondo transparente, reemplazar por <img> aquí y solo aquí.
 */
export function Wordmark({ onDark = false, className = '' }: { onDark?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      aria-label="AGP Desing — inicio"
      className={`inline-flex items-baseline gap-1.5 leading-none min-h-11 py-2 ${onDark ? 'text-silk' : 'text-ink'} ${className}`}
    >
      <span className="font-body font-bold tracking-[-0.03em] text-[1.35rem]">AGP</span>
      <span className={`font-display italic text-[1.5rem] ${onDark ? 'text-rose' : 'text-brand'}`}>Desing</span>
    </Link>
  )
}
