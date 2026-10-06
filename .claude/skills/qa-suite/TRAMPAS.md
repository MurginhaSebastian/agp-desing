# Trampas al medir una web

Errores reales cometidos en este proyecto. Cada uno costó tiempo o, peor, dio por buena una web rota.
Léelos antes de escribir cualquier medición.

## 1. Los colores de Tailwind v4 no son RGB

`getComputedStyle(el).color` devuelve `oklab(0.918 0.007 0.021 / 0.8)` en cuanto el color lleva
opacidad (`text-silk/80`, `bg-bordeaux/40`…). Si lo lees con una expresión regular de números y lo
tratas como RGB, la luminancia sale cerca de cero y **todo** parece tener mal contraste.

Pasó de verdad: una auditoría dio **36 fallos críticos de contraste que no existían**. Textos con
13.5:1 aparecían como 1.22:1.

Hay que convertir oklab (y oklch) a sRGB antes de medir. La conversión está en `shared.mjs`
(`UTILES_COLOR`) y viene con su autocomprobación.

## 2. El desborde lateral que no existe

`document.documentElement.scrollWidth - window.innerWidth` marca desborde cuando dentro hay un
contenedor con su propio scroll, como la tabla del panel en móvil. La página no se mueve, pero el
número dice que sí.

Se mide intentando desplazar de verdad:

```js
window.scrollTo(2000, window.scrollY)
const movido = window.scrollX      // 0 = no hay desborde real
window.scrollTo(0, window.scrollY)
```

## 3. `offsetParent` se salta lo importante

`el.offsetParent === null` parece un buen filtro de "no visible", pero es `null` en **todo lo que
tenga `position: fixed`**: el menú móvil, el velo, los diálogos. Justo donde estaban los fallos más
graves. Se usa `el.getClientRects().length > 0`.

## 4. Contar líneas de un texto

`range.getClientRects().length` no da el número de líneas si dentro hay un `<em>` o un `<span>`: cada
trozo suma un rectángulo. Un titular de 4 líneas con una palabra en cursiva devolvía 7. Para las
líneas, dividir la altura entre la altura de línea; o mejor, medir lo que de verdad importa (si el
botón de abajo entra en pantalla).

## 5. `backdrop-filter` rompe los hijos `fixed`

Un contenedor con `backdrop-blur` se convierte en el marco de referencia de sus descendientes con
`position: fixed`. El menú móvil vivía dentro del `<header>` (que lleva `backdrop-blur-sm`), así que
`top-16 bottom-0` se medía contra los 64 px de la cabecera: **altura cero y panel invisible**, con
los enlaces flotando sobre el texto de la portada.

Funcionaba al pulsarlo, abría y cerraba, pasaba las pruebas de comportamiento. Solo se vio mirando
una captura. La solución: sacarlo con un portal a `document.body`.

Y ojo: `createPortal` tiene que envolver a `AnimatePresence`, no al revés. Al revés no monta nada y
tampoco da error.

## 6. Un "0 hallazgos" sin autocomprobación no vale

Dos veces un control dio limpio porque estaba roto. Antes de creerte un resultado, mete un caso malo
conocido y comprueba que lo detecta. Si no lo caza, el control miente.

## 7. No edites mientras se ejecutan las pruebas

Vite recarga en caliente. Si tocas un archivo mientras un control navega, mide una página a medio
recargar y te inventa fallos. Espera a que terminen.

## 8. El título de la pestaña vuelve por la puerta de atrás

`ProductDetailPage` pone `document.title` al entrar y lo restaura al salir. Si el valor de restauración
se queda viejo, la pestaña muestra el texto antiguo en cuanto el visitante entra a una ficha y vuelve.
Cualquier control del título tiene que navegar a una ficha y volver, no solo cargar la portada.

## 9. Playwright aquí

- No hay Chrome instalado: `chromium.launch({ channel: 'msedge' })`.
- Los scripts deben vivir bajo `frontend/scripts/` para que se resuelva el paquete `playwright`.
- Los enlaces externos (WhatsApp con el número real, redes) **no se navegan**: se comprueba el `href`.
  Abrirlos molesta a personas de verdad.

## 10. Limpia lo que ensucies

Si una prueba crea productos, bórralos y **verifica que se borraron**. Una vez quedaron dos productos
de prueba publicados porque el borrado falló en silencio: la petición devolvía 404 y nadie miraba el
código de respuesta.

## Archivos que parecen no usarse y sí se usan

Al buscar código muerto, tres fuentes de falsos positivos en este proyecto:

1. **Las fotos del catálogo viven en la base de datos**, no en el código. Un archivo de
   `public/images/obras/` puede estar en uso sin aparecer en ningún `.tsx`. Por eso
   `muerto.mjs` le pregunta al catálogo por la API antes de señalar una imagen, y cuando el
   backend no responde lo dice en vez de acusar.
2. **`robots.txt` y el favicon los pide el navegador solo.** Nadie los importa y hacen falta.
3. **`typescript`, `@types/*` y los plugins de Vite** no se importan en ningún archivo: los usa
   el compilador. Una lista blanca ingenua de dependencias se los llevaría por delante.

Y la trampa de fondo: un barrido que borra por su cuenta destruye trabajo. `muerto.mjs` solo
informa; borrar es siempre decisión del dueño.

## Un control que revisa 0 cosas no está limpio, está roto

`muerto.mjs` termina diciendo cuántos archivos, exports, imágenes, dependencias, clases y
métodos revisó, y si algún apartado revisó **cero**, eso se reporta como hallazgo. La versión
anterior de otro control se quedó callada durante toda una auditoría porque no encontraba
`mvnw` y nadie lo notó: «sin hallazgos» y «no miré» se leen igual si no se cuenta lo revisado.

## Una foto que mide 0 × 0 no la ve ningún control

Al meter la foto de la ficha dentro del visor de ampliar, la foto desapareció y todas las
pruebas siguieron en verde: axe no mira tamaños, el contraste no tiene texto que medir y
«pantallas» no encontró desbordes. La causa, de CSS puro: una imagen con `max-w-full` dentro
de un contenedor que se ajusta a su contenido (`w-fit`) no tiene respecto a qué calcular ese
100 %, y el navegador la reduce a cero. Encima, las SVG de muestra solo traían `viewBox`, sin
`width`/`height`, y sin tamaño propio se colapsaban incluso con el arreglo.

Ahora `seg:csp` mide la foto de la ficha y salta en CRÍTICO por debajo de 50 px, y está
probado al revés: quitando otra vez el tamaño a las SVG, salta.

## Los botones ocultos con `clip-path` no se tocan con el dedo

«Pantallas» marcaba el botón de ampliar foto como demasiado pequeño para el dedo (18 px). Ese
botón está oculto a la vista y solo aparece al llegar con el teclado: en el móvil se toca la
foto entera. El control ya eximía la clase `sr-only`, pero las librerías ocultan con la otra
técnica estándar, `clip-path: inset(50%)` / `clip: rect(0 0 0 0)`, y no la reconocía. Ahora
reconoce las dos. Y cuando el botón SÍ aparece, se mide y se cumple: 44 × 44.

## La lista de palabras prohibidas también lee los nombres de variables

Una variable llamada `pintada` («ya se pintó la cuadrícula») saltó como resto del negocio de
pintura. El control hace bien en leer el código entero: renombrar la variable costó menos que
discutir si esa palabra era inocente.

## Las pruebas no las importa nadie

Al añadir Vitest (oct. 2026), «código sin usar» marcó cada `*.test.ts` como archivo que ningún otro
importa. Es verdad y no significa nada: Vitest las encuentra por el nombre. El control ahora las
salta por su sufijo, y solo por él; un archivo normal sin importar sigue saliendo.
