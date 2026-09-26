---
name: qa-suite
description: Suite de calidad de AGP Desing. Detecta y arregla fallos de accesibilidad (axe, Lighthouse, pa11y), de comportamiento en móvil y escritorio, de enlaces y de textos, ejecutando la web de verdad en un navegador. Úsala antes de publicar, después de tocar UI o copy, cuando el usuario pida "pruebas", "QA", "revisa la web", "accesibilidad", "responsive" o "está listo para publicar". No se auto-invoca.
---

# Suite de calidad — AGP Desing

Seis controles que abren la web en un navegador real y miden. No leen el CSS y opinan:
**pulsan, miden y comparan.** El objetivo no es un informe bonito: es dejar la web sin fallos.

## Antes de nada

Los controles necesitan la web en marcha. Si no responde, la suite se para con un aviso claro:

```bash
cd backend && .\run-dev.ps1     # API en :8080 (tarda ~20 s)
cd frontend && npm run dev      # web en :5173
```

Credenciales del panel: `admin` / la clave que esté en `backend/.env`. Los controles la leen de
`QA_ADMIN_PASS` si la exportas; si no, usan la de desarrollo.

## Cómo se ejecuta

```bash
cd frontend
npm run qa              # todo, ~4 min
npm run qa:rapido       # sin Lighthouse, ~90 s (para iterar mientras arreglas)
npm run qa:a11y         # un control suelto
```

| Atajo | Qué mira |
|---|---|
| `qa:a11y` | axe-core en todas las rutas y en los estados que solo existen al interactuar |
| `qa:contraste` | contraste real de cada texto sobre su fondo, resolviendo capas y transparencias |
| `qa:pantallas` | 375 / 768 / 1024 / 1440: desborde, tamaño para el dedo, textos cortados, botones bajo la línea de flotación |
| `qa:enlaces` | WhatsApp, Instagram, TikTok, enlaces internos, página de "no encontrado", enlaces legales del pie |
| `qa:textos` | restos del negocio anterior, marca mal escrita, textos obligatorios, título de la pestaña |
| `qa:lighthouse` | rendimiento, SEO y buenas prácticas |

`npm run qa` sale con código 1 si queda algo CRÍTICO o ALTO.

## El bucle: detectar y arreglar

1. **Ejecuta** `npm run qa` con todo levantado.
2. **Clasifica** cada hallazgo antes de tocar nada:
   - *Fallo real* → se arregla.
   - *Falso positivo* → **se arregla el control**, no se silencia el hallazgo. Y se anota el porqué
     en `TRAMPAS.md`, que para eso está.
   - *Decisión del dueño* (una palabra, un precio, el tono) → no se toca: se le pregunta.
3. **Arregla** de mayor a menor gravedad. Un arreglo cada vez.
4. **Vuelve a ejecutar** el control afectado. No se da por bueno un arreglo sin volver a medir.
5. Cuando esté limpio: `npm run build`, `npm run lint` y commit.

**Regla dura:** nunca bajar un umbral, saltarse una ruta ni añadir una excepción para que pase la
suite. Si un control molesta, es que encontró algo.

## Al escribir un control nuevo

- **Autocomprobación obligatoria.** Antes de fiarte de un "0 hallazgos", mete un caso malo conocido y
  verifica que lo caza. `contrast.mjs` y `a11y.mjs` ya lo hacen; cópialo.
- Mide en el navegador, no en el código fuente.
- Cubre los estados que solo existen al interactuar: menú abierto, diálogo de confirmación, formulario
  con errores. Ahí es donde se escondían los peores fallos de este proyecto.
- Redacta los hallazgos para el dueño del negocio: "el botón no se ve al entrar", no "el CTA está bajo
  el fold por overflow del h1".

## Lo que esta suite no cubre

- **WAVE** no tiene forma gratuita de correr sin navegador: es extensión o API de pago. axe y pa11y
  usan dos motores de reglas distintos y cubren su función. Si quieres pasar WAVE, es a mano con la
  extensión.
- **Accesibilidad juzgada por una persona**: ningún automático detecta un texto alternativo que miente
  ni un orden de lectura confuso. Los automáticos pillan como mucho la mitad.
- **Lighthouse mide en desarrollo** y castiga el rendimiento. Para una medida de verdad:
  `npm run build && npm run preview`, y `QA_BASE=http://localhost:4173 npm run qa:lighthouse`.
- **El backend**: esta suite es de la web. Los tests de la API son `mvnw test`.

Lee `TRAMPAS.md` antes de escribir cualquier medición. Está lleno de errores que ya cometimos.
