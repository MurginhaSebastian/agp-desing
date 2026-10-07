/**
 * Lo que se escribe en una casilla de soles, en céntimos: «95», «95.50», «95,50», «S/ 95» y
 * «1,200.50» valen. Devuelve NaN si no hay un número que leer.
 *
 * La coma se toma como decimal solo si es lo único que separa (y lleva una o dos cifras detrás):
 * en Perú el decimal es el punto, pero en el móvil mucha gente escribe «95,50».
 */
export function aCentimos(texto: string): number {
  let t = texto.replace(/[^\d.,]/g, '')
  if (!t) return NaN
  if (!t.includes('.') && /^\d+,\d{1,2}$/.test(t)) t = t.replace(',', '.')
  else t = t.replace(/,/g, '')
  const n = Number(t)
  return Number.isFinite(n) ? Math.round(n * 100) : NaN
}

/** 9550 → «95.50» (para rellenar una casilla al editar); 9500 → «95». */
export function aTextoDeSoles(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}
