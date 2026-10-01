import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'

/*
 * La web pública lleva el sistema «Capas» desde antes del primer dibujado. PublicLayout también
 * pone la clase, pero sus efectos corren después de los de ScrollManager, que ya mide la página:
 * en ese instante el navegador pedía la tipografía del panel (Cormorant) sin que nadie la viera.
 * PublicLayout la sigue poniendo y quitando al pasar entre la web y el panel.
 */
if (!window.location.pathname.startsWith('/admin')) document.documentElement.classList.add('sitio')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
