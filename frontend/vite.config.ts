import { readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

/**
 * Las cabeceras de seguridad de producción las pone Vercel leyendo `vercel.json`, así que en
 * local no existían y una CSP mal puesta no se notaba hasta publicar. Aquí se leen de ese mismo
 * archivo (una sola fuente de verdad) y se sirven en `vite preview`, que es lo que mide
 * `npm run seg:csp`.
 *
 * Solo en `preview`, nunca en `dev`: el refresco rápido de React inyecta scripts en el HTML y
 * la CSP los bloquearía.
 */
function cabecerasDeVercel(): Record<string, string> {
  try {
    const json = JSON.parse(readFileSync(path.resolve(import.meta.dirname, 'vercel.json'), 'utf8'))
    const out: Record<string, string> = {}
    for (const bloque of json.headers ?? []) {
      for (const h of bloque.headers ?? []) out[String(h.key)] = String(h.value)
    }
    return out
  } catch {
    return {}
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: { port: 5173 },
  preview: { headers: cabecerasDeVercel() },
})
