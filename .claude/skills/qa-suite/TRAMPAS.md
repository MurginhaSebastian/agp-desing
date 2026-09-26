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
