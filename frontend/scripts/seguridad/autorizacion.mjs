import { pathToFileURL } from 'node:url'
/**
 * Permisos: que nadie pueda tocar el catálogo sin ser el dueño.
 *
 * Se llama a la API a pelo (sin navegador, como lo haría cualquiera con curl) y se
 * comprueba que:
 *   - lo público responde,
 *   - lo privado responde 401/403 sin token, con un token inventado y con un token
 *     real al que se le cambió la firma,
 *   - el login no suelta pistas sobre si el usuario existe,
 *   - CORS no acepta una web ajena.
 *
 * Nada de esto escribe en la base de datos: las pruebas de escritura se hacen sin
 * token, así que si el permiso funciona no llegan a ejecutarse. Si alguna crea algo,
 * eso ES el hallazgo.
 */
import { ADMIN, API, GRAVEDAD, imprimir, pedir } from './comun.mjs'

const UUID_CUALQUIERA = '00000000-0000-4000-8000-000000000000'
const CUERPO = JSON.stringify({
  name: 'PRUEBA DE SEGURIDAD (no debería crearse)',
  description: '', priceCents: 100, currency: 'PEN', widthCm: 10, heightCm: 10,
  technique: 'prueba', imageUrl: '/images/obras/no-existe.svg', status: 'AVAILABLE', featured: false,
})

const PUBLICAS = [
  { metodo: 'GET', ruta: '/api/products' },
  { metodo: 'GET', ruta: '/api/settings' },
]

const PRIVADAS = [
  { metodo: 'POST', ruta: '/api/products', cuerpo: CUERPO },
  { metodo: 'PUT', ruta: `/api/products/${UUID_CUALQUIERA}`, cuerpo: CUERPO },
  { metodo: 'DELETE', ruta: `/api/products/${UUID_CUALQUIERA}` },
  { metodo: 'PUT', ruta: '/api/settings', cuerpo: JSON.stringify({ heroImageUrl: '' }) },
  { metodo: 'GET', ruta: `/api/products/${UUID_CUALQUIERA}` },
  // Subir una foto: sin token no debe poder ni empezar. Se manda vacío a propósito, así que
  // aunque el permiso fallara no se subiría nada.
  { metodo: 'POST', ruta: '/api/imagenes' },
]

/** Cambia el último trozo del token (la firma) dejando el resto igual. */
function firmaCambiada(token) {
  const p = token.split('.')
  if (p.length !== 3) return token + 'x'
  const ultima = p[2]
  const distinta = ultima.slice(0, -4) + (ultima.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA')
  return `${p[0]}.${p[1]}.${distinta}`
}

async function llamar({ metodo, ruta, cuerpo }, token) {
  const headers = { Accept: 'application/json' }
  if (cuerpo) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return pedir(API + ruta, { method: metodo, headers, body: cuerpo })
}

export async function run() {
  const hallazgos = []

  // Lo público sigue siendo público
  for (const p of PUBLICAS) {
    const r = await llamar(p)
    if (r.error || r.estado !== 200) {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: `${p.metodo} ${p.ruta}`, que: 'lo que debería ser público no responde', detalle: r.error ?? `HTTP ${r.estado}` })
    }
  }

  // Un token de verdad, para poder probar la firma cambiada
  const login = await pedir(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username: ADMIN.usuario, password: ADMIN.clave }),
  })
  let tokenReal = null
  if (!login.error && login.estado === 200) {
    try { tokenReal = JSON.parse(login.cuerpo).token } catch { /* sin token */ }
  }

  const intentos = [
    { nombre: 'sin token', token: null },
    { nombre: 'con un token inventado', token: 'esto.no.es-un-token' },
    { nombre: 'con un token vacío', token: '' },
    ...(tokenReal ? [{ nombre: 'con la firma del token cambiada', token: firmaCambiada(tokenReal) }] : []),
  ]

  for (const intento of intentos) {
    for (const p of PRIVADAS) {
      const r = await llamar(p, intento.token)
      if (r.error) {
        hallazgos.push({ gravedad: GRAVEDAD.medio, donde: `${p.metodo} ${p.ruta}`, que: `no respondió ${intento.nombre}`, detalle: r.error })
        continue
      }
      if (r.estado !== 401 && r.estado !== 403) {
        hallazgos.push({
          gravedad: GRAVEDAD.critico,
          donde: `${p.metodo} ${p.ruta}`,
          que: `se puede usar ${intento.nombre}`,
          detalle: `devolvió HTTP ${r.estado} en vez de 401`,
        })
      }
    }
  }

  /*
   * CONTROL POSITIVO. Sin esto la prueba se engañaría sola: el backend responde 401 a
   * CUALQUIER ruta que no conozca (`anyRequest().denyAll()`), así que una ruta mal
   * escrita «pasaría» el examen sin que nadie la proteja. Con el token de verdad, esas
   * mismas rutas tienen que responder algo distinto de 401.
   * Se eligen llamadas que no crean ni borran nada: un id que no existe (404) y un
   * cuerpo inválido a propósito (400).
   */
  if (tokenReal === null) {
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'control positivo', que: 'no se pudo entrar como administrador, así que los 401 de arriba no prueban gran cosa', detalle: 'revisa QA_ADMIN_USER / QA_ADMIN_PASS' })
  } else {
    const controles = [
      { nombre: 'GET /api/products/{id} con token', peticion: { metodo: 'GET', ruta: `/api/products/${UUID_CUALQUIERA}` }, espera: [404] },
      { nombre: 'DELETE /api/products/{id} con token', peticion: { metodo: 'DELETE', ruta: `/api/products/${UUID_CUALQUIERA}` }, espera: [404] },
      { nombre: 'POST /api/products con token', peticion: { metodo: 'POST', ruta: '/api/products', cuerpo: '{}' }, espera: [400] },
      { nombre: 'PUT /api/settings con token', peticion: { metodo: 'PUT', ruta: '/api/settings', cuerpo: JSON.stringify({ heroImageUrl: 'no-vale-esta-ruta' }) }, espera: [400] },
      // Sin archivo: 400 o 415 según lo pille el servidor antes o después de mirar el tipo.
      // Lo que importa es que NO sea 401: eso probaría que la ruta existe y está protegida.
      { nombre: 'POST /api/imagenes con token', peticion: { metodo: 'POST', ruta: '/api/imagenes' }, espera: [400, 415] },
    ]
    for (const c of controles) {
      const r = await llamar(c.peticion, tokenReal)
      if (r.error || !c.espera.includes(r.estado)) {
        hallazgos.push({
          gravedad: GRAVEDAD.medio,
          donde: 'control positivo',
          que: `${c.nombre} no respondió lo esperado, así que su prueba de permiso no vale`,
          detalle: r.error ?? `HTTP ${r.estado}, se esperaba ${c.espera.join(' o ')}`,
        })
      }
    }
  }

  // El login no debe decir si el usuario existe o no
  const inexistente = await pedir(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nadie-con-este-nombre', password: 'loquesea' }),
  })
  const claveMala = await pedir(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN.usuario, password: 'clave-equivocada-a-proposito' }),
  })
  if (!inexistente.error && !claveMala.error && inexistente.estado !== 429 && claveMala.estado !== 429) {
    if (inexistente.estado !== claveMala.estado) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'login', que: 'responde distinto si el usuario existe', detalle: `${inexistente.estado} vs ${claveMala.estado}` })
    }
    if (/no existe|not found|usuario desconocido/i.test(inexistente.cuerpo)) {
      hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'login', que: 'el mensaje delata que el usuario no existe', detalle: inexistente.cuerpo.slice(0, 80) })
    }
  }

  // Ni rastro de contraseñas o hashes en las respuestas
  const lista = await llamar({ metodo: 'GET', ruta: '/api/products' })
  if (!lista.error && /password|passwordHash|\$2[aby]\$/.test(lista.cuerpo)) {
    hallazgos.push({ gravedad: GRAVEDAD.critico, donde: 'GET /api/products', que: 'la respuesta contiene datos de contraseñas' })
  }

  // CORS: una web ajena no puede leer la API desde el navegador
  const ajeno = await pedir(`${API}/api/products`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://sitio-que-no-es-mio.example', 'Access-Control-Request-Method': 'GET' },
  })
  if (!ajeno.error) {
    const permitido = ajeno.cabeceras['access-control-allow-origin']
    if (permitido === '*' || permitido === 'https://sitio-que-no-es-mio.example') {
      hallazgos.push({ gravedad: GRAVEDAD.alto, donde: 'CORS', que: 'la API acepta peticiones de una web ajena', detalle: `Access-Control-Allow-Origin: ${permitido}` })
    }
  }

  // Sin stack traces ni rutas internas en los errores
  const roto = await pedir(`${API}/api/products/no-es-un-uuid`)
  if (!roto.error && /com\.agpdesing|at java\.|Exception|\?[A-Z]:\\/.test(roto.cuerpo)) {
    hallazgos.push({ gravedad: GRAVEDAD.medio, donde: 'errores', que: 'un error enseña detalles internos del servidor', detalle: roto.cuerpo.slice(0, 100) })
  }

  return { titulo: 'Permisos de la API', hallazgos }
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = await run()
  imprimir(r.titulo, r.hallazgos)
  process.exit(r.hallazgos.some((h) => h.gravedad === GRAVEDAD.critico || h.gravedad === GRAVEDAD.alto) ? 1 : 0)
}
