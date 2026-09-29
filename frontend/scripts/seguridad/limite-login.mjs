import { pathToFileURL } from 'node:url'
/**
 * El freno del login: que no se puedan probar contraseñas sin límite.
 *
 * Se manda una contraseña equivocada doce veces cambiando en cada intento la cabecera
 * `X-Forwarded-For` (la que dice «vengo de esta IP» y que la escribe quien llama, no el
 * servidor). Si el servidor se la cree, cada intento cae en un contador distinto y no
 * aparece nunca el 429: eso es fuerza bruta sin freno.
 *
 * Aviso: después de esta prueba el login queda bloqueado un minuto. Es lo que se está
 * midiendo. Por eso va al final de la auditoría.
 */
import { API, GRAVEDAD, imprimir, pedir } from './comun.mjs'

const INTENTOS = 12
const ESPERADO_ANTES_DEL_FRENO = 5

async function intentar(ip) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  if (ip) headers['X-Forwarded-For'] = ip
  return pedir(`${API}/api/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ username: 'admin', password: 'clave-equivocada-para-la-prueba' }),
  })
}

export async function run() {
  const hallazgos = []

  // ¿Se puede medir? Si ya viene bloqueado de antes, la prueba no dice nada.
  const sonda = await intentar('203.0.113.7')
  if (sonda.error) {
    return { titulo: 'Freno del login', hallazgos: [{ gravedad: GRAVEDAD.medio, donde: 'login', que: 'el backend no respondió', detalle: sonda.error }] }
  }
  if (sonda.estado === 429) {
    return { titulo: 'Freno del login', hallazgos: [{ gravedad: GRAVEDAD.bajo, donde: 'login', que: 'ya estaba frenado antes de empezar; espera un minuto y repite' }] }
  }
  if (sonda.estado !== 401) {
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'login', que: 'una contraseña equivocada no devuelve 401', detalle: `HTTP ${sonda.estado}` })
  }

  const codigos = [sonda.estado]
  for (let i = 1; i < INTENTOS; i++) {
    // Una IP distinta e inventada en cada intento, que es justo lo que haría un atacante.
    const r = await intentar(`198.51.100.${i}`)
    codigos.push(r.error ? 0 : r.estado)
  }

  const frenados = codigos.filter((c) => c === 429).length
  const primerFreno = codigos.indexOf(429)

  if (frenados === 0) {
    hallazgos.push({
      gravedad: GRAVEDAD.critico,
      donde: 'login',
      que: 'se pueden probar contraseñas sin límite cambiando la cabecera de IP',
      detalle: `${INTENTOS} intentos seguidos y ni un solo 429`,
    })
  } else if (primerFreno > ESPERADO_ANTES_DEL_FRENO) {
    hallazgos.push({
      gravedad: GRAVEDAD.medio,
      donde: 'login',
      que: 'el freno tarda más de lo previsto en entrar',
      detalle: `primer 429 en el intento ${primerFreno + 1}; se esperaba a partir del ${ESPERADO_ANTES_DEL_FRENO + 1}`,
    })
  }

  // El 429 no debe contar nada de la cuenta ni de la contraseña
  const bloqueado = codigos.includes(429) ? await intentar('198.51.100.200') : null
  if (bloqueado && !bloqueado.error && /hash|\$2[aby]\$|usuario no|no existe/i.test(bloqueado.cuerpo)) {
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'login', que: 'el mensaje de bloqueo cuenta más de lo que debería', detalle: bloqueado.cuerpo.slice(0, 90) })
  }

  return {
    titulo: 'Freno del login',
    hallazgos,
    nota: `intentos: ${codigos.join(' ')} — el login queda bloqueado cerca de un minuto`,
  }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  if (r.nota) console.log(`  (${r.nota})`)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
