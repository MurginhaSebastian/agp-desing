# Trampas al medir seguridad

Cada una se cobró un rato de esta auditoría. Un control que se engaña a sí mismo es peor que
no tener control: da tranquilidad sin haber comprobado nada.

## 1. El backend responde 401 a las rutas que no existen

`SecurityConfig` acaba en `anyRequest().denyAll()`. Eso significa que
`POST /api/productos-mal-escrito` devuelve **401**, igual que un endpoint bien protegido. Un
control que solo compruebe «devuelve 401 sin token» aprueba también las rutas inventadas: no
está midiendo el permiso, está midiendo que la ruta no existe.

**Cómo se evita:** el control positivo de `autorizacion.mjs`. Con el token de verdad, esas
mismas rutas tienen que responder algo **distinto** de 401 (404 con un id que no existe, 400
con un cuerpo inválido). Si responden 401 con token válido, la ruta está mal escrita y su
prueba no vale nada.

## 2. Una tabla de Supabase que devuelve `[]` está protegida, no ausente

La API REST de Supabase responde `HTTP 200 []` cuando la tabla existe y el RLS no deja ver
nada. Es fácil leerlo como «no hay nada que ver aquí». Lo que hay que buscar es
**`200` con filas**: eso es lectura abierta a internet. `401`, `403` o `404` significan que
la API ni sirve esa tabla.

## 3. Las cabeceras de Vercel no existían en local

`vercel.json` lo lee Vercel al servir, no Vite: por defecto ni `npm run dev` ni `vite preview`
mandan esas cabeceras, así que medirlas en local daba siempre «faltan todas» y una CSP mal
puesta no se notaba hasta publicar.

Ahora `vite.config.ts` lee ese mismo `vercel.json` y sirve sus cabeceras en **`preview`** (no en
`dev`: el refresco rápido de React inyecta scripts en el HTML y la CSP los bloquearía). Con eso,
`csp.mjs` puede medirlas de verdad con un navegador.

Lo que sigue sin poder comprobarse en local es que **Vercel** las mande en producción; eso solo
lo dice `SEG_URL_PUBLICA=https://tu-web npm run seg:cabeceras` con la web ya publicada.

## 3 bis. Un servidor de prueba que no murió aprueba el examen por ti

La primera versión de `csp.mjs` usaba un puerto fijo y mataba solo al proceso padre. En Windows
`npm run preview` es un `.cmd` que arranca node aparte, así que el servidor seguía vivo: en la
ejecución siguiente el nuevo no podía coger el puerto, y la prueba medía **la web de antes**.
Resultado: rompí la CSP a propósito (`script-src 'none'`, que debería dejar la página en blanco)
y el control dijo «sin hallazgos».

Tres defensas, y hacen falta las tres:

- puerto **al azar** en cada ejecución;
- comparar la CSP **servida** con la escrita en `vercel.json` y, si no coinciden, decir «no se
  pudo medir» en vez de aprobar;
- `taskkill /T /F` para llevarse el árbol de procesos entero al terminar.

La lección general: cuando un control depende de un servidor que él mismo levanta, tiene que
comprobar que está midiendo **ese** servidor.

## 4. Los `integrity` de `package-lock.json` parecen claves

Son hashes en base64 (`sha512-…`) y encajan con cualquier patrón de «cadena larga aleatoria».
Un escáner de secretos sin exclusiones saca decenas de hallazgos falsos y entierra los de
verdad. Están excluidos, junto con `*.env.example` (plantillas con los huecos vacíos) y las
fuentes (binarios donde cualquier patrón acierta por casualidad).

## 5. Buscar secretos solo en los archivos de hoy no sirve

Un commit que borra una clave no la quita del historial: sigue estando en los commits
anteriores y en la copia que GitHub ya guardó. `secretos.mjs` mira las dos cosas, con el
«pickaxe» de git (`git log --all -S`), que recorre los cambios de cada commit sin volcar los
diffs. Y revisa `refs/original/`, que es lo que deja `filter-branch` y mantiene vivos los
commits viejos aunque las ramas ya estén reescritas.

## 6. Un `\s` dentro de un patrón para `git grep` no significa «espacio»

El motor de git es POSIX: entiende `[[:space:]]`, no las abreviaturas de Perl. Con `\s` el
patrón busca la letra «s» y no falla, simplemente deja de encontrar lo que buscaba. Los
patrones de `secretos.mjs` están escritos en POSIX a propósito.

## 7. El freno del login se mide una sola vez por minuto

Después de doce intentos, el contador está vacío: la siguiente medición saldrá «frenado» sin
haber probado nada. `limite-login.mjs` empieza con una sonda y, si ya viene bloqueado, lo dice
en vez de dar un falso aprobado. Y por eso este control va al final de la auditoría: deja el
login inservible un minuto, incluido el del dueño.

Detalle relacionado: el control de `permisos` también gasta intentos (entra al panel y prueba
dos contraseñas equivocadas). Al correr la suite entera, el 429 aparece antes que si se lanza
`seg:login` a solas — por eso el control exige el freno «a partir del sexto intento», no «en
el sexto exactamente».

## 8. El contador de intentos puede ser el agujero

El error original no era que faltara el freno: era que el freno se fiaba de
`X-Forwarded-For`, que la escribe quien llama. Cada intento con una IP inventada distinta caía
en un contador nuevo. La prueba tiene que **cambiar la cabecera en cada intento**; si no,
mide el caso fácil y aprueba un login sin protección real.

## 9. Un escáner de dependencias que no encuentra nada quizá no ha mirado

`mvnw.cmd` sin `.\` delante no se encuentra desde `cmd` (no busca en la carpeta actual), y el
control se quedaba en «no se pudo listar las dependencias» — un aviso medio, fácil de pasar
por alto entre otros. Cuando el listado sí funciona, `dependencias.mjs` dice **cuántas**
librerías revisó: si ese número es 0 o mucho menor de lo normal (78 en el backend), el control
no midió nada.

## 10. Distinguir lo que llega al navegador de lo que se queda en el taller

`npm audit` mezcla las dos cosas. Los 22 avisos de este proyecto vienen de `pa11y` →
`puppeteer`, herramientas de prueba que nunca se publican. Contarlos como riesgo para el
visitante lleva a `npm audit fix --force`, que rompe la suite de QA a cambio de nada. El
control los separa y lo dice.

## 11. Un manejador de `Exception` se traga los errores del propio framework

`@ExceptionHandler(Exception.class)` no solo atrapa lo que lanza el código propio: atrapa también
lo que lanza Spring antes de llegar a él. Al añadir la subida de fotos, «la foto pesa demasiado» y
«esto no vino como un envío de archivo» salían las dos como **500 «Algo salió mal»**, que no dice
nada y además queda registrado como fallo del servidor.

Cada caso necesita su propio manejador, y el orden importa: `MaxUploadSizeExceededException`
hereda de `MultipartException`, así que va antes o nunca se ejecuta. El 415 por
`HttpMediaTypeNotSupportedException` se me escapó hasta que el control de permisos lo cazó: su
control positivo esperaba un 400 y recibió un 500. Un control bien hecho encuentra cosas que no
estaba buscando.

## 12. Fiarse del tipo que declara el navegador es no validar nada

El `Content-Type` de un archivo subido lo escribe quien sube: basta renombrar `virus.svg` a
`foto.jpg` para que llegue como `image/jpeg`. Lo que no se puede falsear tan fácil son los
primeros bytes del archivo, que es donde cada formato lleva su marca. Por eso `DetectorDeImagen`
mira los bytes y la extensión con la que se guarda sale del formato **detectado**, no del
declarado. Comprobado en la prueba: un PNG declarado como JPEG se guarda como `.png`.

## 13. Un control puede quedarse desfasado y convertirse en ruido

El control de fotos avisaba de cualquier imagen alojada fuera de la web, porque hasta ahora eso
significaba un sitio de terceros que nadie había declarado. Desde que el panel sube las fotos a
Supabase Storage, ese aviso saltaba con **todas** las fotos, incluidas las que están donde deben.

La tentación es bajarle la gravedad o quitarlo. Lo correcto fue enseñarle cuál es el almacén
propio (lo lee de `SUPABASE_URL`) para que siga avisando de cualquier otro, y comprobar que sigue
avisando: con una `SUPABASE_URL` falsa vuelve a saltar. Un control que no distingue lo esperado de
lo inesperado acaba ignorándose, y entonces ya no protege de nada.

De paso, tenía razón en una cosa que sí había que arreglar: la página de privacidad decía que
ningún tercero recibe nada, y ahora el navegador del visitante sí se conecta a Supabase para ver
las fotos. Se añadió a la política y se movió su fecha.

## 14. El día que el control de secretos aprobó una contraseña publicada

La contraseña del panel estuvo escrita en `frontend/scripts/qa/shared.mjs`, como valor por
defecto de `QA_ADMIN_PASS`, y el repositorio es público. Cuatro días a la vista de cualquiera. El
control decía «sin hallazgos».

Fueron dos fallos encadenados, y el segundo es el que da miedo:

1. **Buscaba formatos, no formas.** Los patrones reconocían claves de máquina (`sb_secret_…`,
   `AKIA…`, tokens de GitHub). Una contraseña que escoge una persona no tiene formato. Lo que sí
   se puede buscar es **la forma**: una variable que se llama como una credencial con un valor
   literal al lado. Eso es lo que ahora mira `CREDENCIALES_A_MANO`.
2. **Los patrones pasaban por `cmd`.** `ejecutar()` usaba `shell: true` en Windows, que hace
   falta para `npm` y `mvnw.cmd`, pero destroza los patrones con comillas y barras verticales. Y
   el comando **no fallaba**: devolvía cero resultados. Un control que no encuentra nada y un
   control que no busca nada se ven exactamente igual desde fuera. Por eso `git` se ejecuta ahora
   con `shell: false`.

La regla que queda: **cuando un control pasa a la primera y no ha encontrado nunca nada, hay que
darle algo que encontrar.** Si no salta, no está midiendo.

## 15. Un `.env` con comillas rompe el login sin decir por qué

`QA_ADMIN_PASS='clave con espacios'` es una forma perfectamente normal de escribir un `.env`, y
casi todos los lectores quitan esas comillas. El de aquí no, así que se las llevaba dentro de la
contraseña: la variable «existía», el control la daba por configurada, y el intento de entrar
fallaba como si la contraseña estuviera mal. Se perdió un buen rato buscando el problema en la
base de datos. Ahora `quitarComillas()` las quita en los tres sitios donde se leen `.env`.

## 16. Una variable que falta puede apagar un control entero

El control que comprueba quién puede escribir en el almacén de fotos empezaba con
`if (!bucket) return []`. Como `SUPABASE_BUCKET` no está escrita en `backend/.env` —el backend no
la necesita, tiene un valor por defecto—, el control **se saltaba en silencio** y la auditoría
salía en verde sin haberlo comprobado.

Los valores por defecto tienen que estar en los dos lados o en ninguno. Y un control que no puede
medir debe **decirlo como hallazgo**, nunca devolver una lista vacía, que se lee igual que «todo
bien».

## 17. Un aviso sin parche en la rama que usas no es «aflojar el control» si no te expone

El 9 oct. 2026, antes de publicar, `dependencias.mjs` marcó `spring-webmvc 6.2.19` como ALTO por
dos avisos: `GHSA-j9f9-w8pj-32f8` (corrupción de stream en SSE con fragmentos de vista) y
`GHSA-pc63-qcmh-9cmg` (XsltView → SSRF/RCE con un mapeo `/**` que renderiza vistas). Los dos
exigen **renderizado de vistas de servidor**. Esta API es solo `@RestController` (sin vistas, SSE
ni XsltView; comprobado en los controladores y en `mvnw dependency:tree`, donde no entra ningún
motor de vistas). Y **no hay parche en la línea 6.2**: lo último en Central es 6.2.19 y Boot
3.5.16 (lo que usamos); el arreglo solo está en Spring 7.0.9 / Boot 4, que es una migración mayor.

La tentación fácil es subir la versión a ciegas (rompería Boot 3.5) o bajarle la gravedad al
control a secas. Lo correcto fue una **excepción acotada**: solo esos dos IDs, en `EXCEPCIONES`
de `dependencias.mjs`, cada uno con su motivo y su gatillo de revisión («al subir a Boot 4»). El
hallazgo **sigue saliendo**, degradado a BAJO, para que nadie lo olvide; y en cuanto aparezca un
paquete con un aviso que no esté en la lista, vuelve a ser ALTO y a bloquear. Un aviso que no
puedes disparar con el código que tienes no es lo mismo que un aviso que no existe: por eso no se
borra, se documenta y se revisa al tocar las vistas o al migrar.

## 18. stderr pegado a stdout rompe un control que parsea JSON

El mismo día, el control de `npm audit` salía como MEDIO «no se pudo ejecutar». No era verdad:
`npm audit --omit=dev --json` devolvía JSON válido con **cero** vulnerabilidades en producción.
El problema era el control: `npm` sale con código 1 cuando encuentra algo (o por un aviso), y
entonces `ejecutar` devuelve **stdout + stderr concatenados**; los avisos de npm (y el `DEP0190`
de Node en Windows) iban detrás del JSON y `JSON.parse` se atragantaba con la cola. Un control que
no puede parsear se lee igual que uno que no encuentra nada —o peor, que da un falso MEDIO que
tapa lo demás—. Ahora `auditarNpm` recorta al objeto JSON (del primer `{` al último `}`) antes de
parsear. Lección repetida: cuando un control depende de la salida de un comando, tiene que separar
lo que mide de lo que el sistema le mete por el mismo tubo.
