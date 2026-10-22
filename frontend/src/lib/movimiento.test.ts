import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EASE_DRAWER, EASE_IN_OUT, EASE_OUT } from '@/lib/movimiento'

/*
 * Las curvas de Motion son las mismas de `index.css` (`--ease-*`): si cambia una, cambia la otra.
 * Esta prueba lee el CSS y lo compara, para que no se desincronicen en silencio.
 * Vitest corre con cwd en `frontend/`.
 */
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

function curvaCss(token: string): readonly number[] {
  const m = css.match(new RegExp(`--${token}:\\s*cubic-bezier\\(([^)]+)\\)`))
  if (!m) throw new Error(`No se encontró --${token} en index.css`)
  return m[1].split(',').map((n) => Number(n.trim()))
}

describe('movimiento (curvas = index.css)', () => {
  it('EASE_OUT coincide con --ease-out', () => {
    expect([...EASE_OUT]).toEqual(curvaCss('ease-out'))
  })
  it('EASE_IN_OUT coincide con --ease-in-out', () => {
    expect([...EASE_IN_OUT]).toEqual(curvaCss('ease-in-out'))
  })
  it('EASE_DRAWER coincide con --ease-drawer', () => {
    expect([...EASE_DRAWER]).toEqual(curvaCss('ease-drawer'))
  })
})
