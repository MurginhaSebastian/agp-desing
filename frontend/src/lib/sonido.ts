/**
 * El «pop» que suena al pulsar algo en la web pública.
 *
 * Web Audio y no `new Audio().play()`: en móvil tarda menos en sonar y cada clic lanza su
 * propia copia, así que dos clics seguidos no se cortan entre sí. El `AudioContext` se crea
 * en el primer clic y no antes: creado sin un gesto del visitante, el navegador lo deja mudo
 * y ensucia la consola con un aviso de autoplay.
 */

/**
 * En `public/` y no en `src/assets` a propósito: Vite incrusta como `data:` lo que pesa menos
 * de 4 KB, `connect-src` de la CSP no admite `data:` y el pop dejaría de sonar sin ningún error.
 */
const URL_POP = `${import.meta.env.BASE_URL}sonidos/pop.wav`
/** El archivo pica en −26,5 dB y en el altavoz de un celular casi no se oye: ×4 lo sube unos 12 dB. */
const GANANCIA = 4
/**
 * Lo que se puede pulsar. Sin `label` ni `input` a propósito: al pulsar una etiqueta el
 * navegador lanza un segundo clic sobre su casilla y el pop sonaría dos veces.
 */
const PULSABLE = 'a[href], button:not(:disabled), summary, select, [role="button"]'

let ctx: AudioContext | null = null
let pop: Promise<AudioBuffer> | null = null

function sonarPop() {
  try {
    const audio = (ctx ??= new AudioContext())
    // No solo 'suspended': Safari lo deja en 'interrupted' tras una llamada o al volver de otra app.
    if (audio.state !== 'running') audio.resume().catch(() => {})
    pop ??= fetch(URL_POP)
      .then((r) => r.arrayBuffer())
      .then((datos) => audio.decodeAudioData(datos))
    pop
      .then((buffer) => {
        const fuente = audio.createBufferSource()
        fuente.buffer = buffer
        const volumen = audio.createGain()
        volumen.gain.value = GANANCIA
        fuente.connect(volumen).connect(audio.destination)
        fuente.start()
      })
      // Si falla la descarga, se reintenta en el siguiente clic.
      .catch(() => {
        pop = null
      })
  } catch {
    // Navegador sin Web Audio: la web sigue igual, sin sonido.
  }
}

/**
 * Un solo escuchador para toda la página, en captura: así un `stopPropagation` de algún
 * componente no lo silencia, y también recoge el menú móvil, que cuelga de un portal.
 * `click` y no `pointerdown`: en móvil `pointerdown` salta al empezar a desplazarse con el
 * dedo, y `click` además llega cuando se pulsa con Enter o Espacio.
 */
export function escucharClics() {
  const alPulsar = (e: MouseEvent) => {
    const el = e.target instanceof Element ? e.target.closest(PULSABLE) : null
    if (el && el.getAttribute('aria-disabled') !== 'true') sonarPop()
  }
  document.addEventListener('click', alPulsar, { capture: true })
  return () => document.removeEventListener('click', alPulsar, { capture: true })
}
