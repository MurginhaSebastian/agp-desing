// Capturas de QA: recorre la página para disparar los reveals y guarda PNGs en ../docs/qa
// Uso: node scripts/qa-shots.mjs  (requiere el dev server en :5173 y Edge o Chrome instalado)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE ?? 'http://localhost:5173'
const OUT = new URL('../../docs/qa/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]
const pages = [
  { name: 'home', path: '/' },
  { name: 'catalogo', path: '/catalogo' },
  { name: 'obra', path: '/catalogo/tarde-en-bordeaux' },
  { name: 'admin-login', path: '/admin/login' },
]

const browser = await chromium.launch({ channel: process.env.QA_CHANNEL ?? 'msedge' })
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  for (const p of pages) {
    await page.goto(BASE + p.path, { waitUntil: 'networkidle' })
    await page.evaluate(async () => {
      await document.fonts.ready
      const step = window.innerHeight * 0.4
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 350))
      }
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${OUT}${p.name}-${vp.name}.png`, fullPage: true })
    console.log(`✓ ${p.name}-${vp.name}.png`)
  }
  if (errors.length) console.log(`  console errors (${vp.name}):`, errors)
  await ctx.close()
}
await browser.close()

// Panel admin (modo demo): iniciar sesión y capturar lista + formulario en escritorio
{
  const browser2 = await chromium.launch({ channel: process.env.QA_CHANNEL ?? 'msedge' })
  const page = await browser2.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' })
  await page.getByLabel('Usuario').fill('admin')
  await page.getByLabel('Contraseña').fill('demo')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('**/admin')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}admin-lista-desktop.png`, fullPage: true })
  console.log('✓ admin-lista-desktop.png')
  await page.goto(BASE + '/admin/cuadros/nuevo', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}admin-nuevo-desktop.png`, fullPage: true })
  console.log('✓ admin-nuevo-desktop.png')
  if (errors.length) console.log('  page errors (admin):', errors)
  await browser2.close()
}
