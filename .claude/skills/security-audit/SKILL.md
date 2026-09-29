---
name: security-audit
description: Auditoría de seguridad de AGP Desing — busca fallos que permitan entrar al panel, leer la base de datos desde fuera, filtrar datos privados o explotar librerías viejas, y los arregla. Úsala antes de publicar, al tocar login/permisos/CORS/cabeceras, al añadir dependencias o cuando el usuario pida revisar la seguridad.
---

# Auditoría de seguridad — AGP Desing

Hermana de `qa-suite`: esa mira que la web se vea y se use bien; esta mira que no se pueda
abusar de ella. Mismo estilo: **se mide, no se supone**, y todo hallazgo se arregla en el
mismo turno o se explica por qué no.

## Cómo se lanza

```bash
cd frontend
npm run seg              # todo (necesita el front en :5173 y el back en :8080)
npm run seg:rapido       # sin los dos controles lentos (librerías y CSP)

npm run seg:secretos     # claves y contactos, en los archivos y en el historial
npm run seg:dependencias # npm audit + Maven contra osv.dev
npm run seg:cabeceras    # cabeceras declaradas en vercel.json, y las de la API medidas
npm run seg:csp          # compila, sirve la web con sus cabeceras y mira que no se rompa
npm run seg:supabase     # qué se ve de la base de datos con la clave pública
npm run seg:fotos        # de dónde salen las fotos del catálogo y si se ven enteras
npm run seg:permisos     # cada endpoint sin token / con token falso
npm run seg:login        # ¿se puede probar contraseñas sin límite?
```

Dos variables opcionales:

- `SEG_URL_PUBLICA=https://…` → mide las cabeceras de la web **publicada** (lo único que
  prueba de verdad que Vercel las manda).
- `SUPABASE_PUBLISHABLE_KEY` en `backend/.env` → sin ella, el control de Supabase se salta.
  Esa clave es pública por diseño, pero el archivo no se sube.

`npm run seg:login` deja el login bloqueado cerca de un minuto. Es lo que mide. Va al final.

## Las diez preguntas

Cada control responde a una pregunta concreta. Si se añade algo al proyecto, se añade la
pregunta que le corresponda.

| # | Pregunta | Control |
|---|---|---|
| 1 | ¿Hay claves o datos personales dentro del repositorio, hoy o en algún commit viejo? | `secretos` |
| 2 | ¿Alguna librería tiene un fallo conocido? ¿Llega al navegador o se queda en desarrollo? | `dependencias` |
| 3 | ¿La web y la API mandan las cabeceras que protegen al visitante? | `cabeceras` |
| 4 | ¿Qué se puede leer de la base de datos desde internet con la clave pública? | `supabase` |
| 5 | ¿Se puede crear, editar o borrar un cuadro sin ser el dueño? | `permisos` |
| 6 | ¿Se pueden probar contraseñas sin límite? | `login` |
| 7 | ¿Puede una web ajena leer la API desde el navegador de un visitante? | `permisos` (CORS) |
| 8 | ¿Esas cabeceras dejan la web usable, o la parten? | `csp` |
| 9 | ¿Se puede colar un archivo que no es una foto, o una foto con la ubicación de alguien dentro? | `permisos` + tests del backend |
| 10 | ¿Puede alguien con una sesión abierta llenar el almacén de fotos? | freno de `POST /api/imagenes` |
| 9 | ¿Las fotos del catálogo salen de un servidor ajeno (y siguen ahí)? | `fotos` |

## Cómo se arregla cada cosa

**Permisos (`permisos` en rojo).** Las reglas están en `SecurityConfig`, no en los
controladores. `anyRequest().denyAll()` es la red final: todo lo que no esté nombrado se
deniega. Un endpoint nuevo se añade ahí explícitamente, y luego se comprueba que el control
positivo del script lo ve (ver TRAMPAS).

**Freno del login (`login` en rojo).** `ClientIpResolver` decide de qué IP viene cada
petición y `LoginRateLimiter` cuenta. Nunca confiar en `X-Forwarded-For` sin saber cuántos
proxies propios hay delante: eso se configura con `TRUSTED_PROXY_HOPS` (0 en local, 1 en
Render/Vercel). El contador global es la red que queda cuando el atacante cambia de IP.

**Cabeceras (`cabeceras` en rojo).** Las de la web se declaran en `frontend/vercel.json`;
las de la API, en el bloque `.headers(...)` de `SecurityConfig`. En la CSP de la web, jamás
`unsafe-eval` ni `unsafe-inline` en `script-src`. Si algún día se sirven imágenes solo
propias, apretar `img-src` a `'self'`.

**Base de datos (`supabase` en rojo).** Se arregla **en Supabase**, no en una migración de
Flyway: `ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;` o quitarle el permiso a `anon` y
`authenticated`, con el backend parado. Comprobar también Supabase → **Advisors → Security**,
que hace sola esta misma revisión. Una migración que toque `flyway_schema_history` se queda
esperando: Flyway la tiene bloqueada mientras migra.

**Librerías (`dependencias` en rojo).** Backend: parchear con una propiedad en `pom.xml`
(`tomcat.version`, `jackson-bom.version`, `log4j2.version`, `postgresql.version`) en vez de
saltar de versión de Spring Boot, y anotar por qué; al subir Spring Boot, comprobar si ya
sobran. Web: si el aviso es de una herramienta de desarrollo, se anota y se deja — **nunca
`npm audit fix --force`**, que rompe la suite de QA. Después de tocar el `pom.xml`:
`.\mvnw.cmd test`.

**Fotos (`fotos` en rojo).** Una foto en otro dominio hace que cada visitante le entregue su IP
a ese tercero, y la política de privacidad dice que no hay ninguno; además, el día que ese
servicio borre el archivo la tarjeta se queda vacía. Se arregla guardando el archivo en
`frontend/public/images/obras/` y poniendo en `/admin` una dirección que empiece por `/`. Cuando
no quede ninguna foto externa, apretar `img-src` de la CSP a `'self' data:` y comprobarlo con
`npm run seg:csp`.

**Subida de fotos.** Solo JPG, PNG y WebP, y se reconocen **por sus primeros bytes**: el tipo que
declara el navegador se puede falsear renombrando el archivo. SVG se rechaza a propósito (es texto
y puede llevar scripts en un bucket público). Antes de guardar se le quitan los metadatos
(ubicación GPS, modelo del teléfono) sin recodificar la imagen; si el archivo está tan mal formado
que no se puede recorrer, **no se sube**: mejor un error que publicar una foto sin limpiar. Al
tocar `UploadImageUseCase`, `DetectorDeImagen` o `LimpiadorDeMetadatos`, correr
`.\mvnw.cmd test -Dtest=SubirImagenTest`, que comprueba que la foto sigue abriéndose y del mismo
tamaño después de limpiarla.

**Freno de la subida.** `POST /api/imagenes` admite 20 fotos por minuto y por usuario
(`SubidaRateLimiter`, contando por el usuario del token y no por IP). Sin eso, una sesión abierta
en un ordenador prestado basta para llenar el almacén y para tener al servidor moviendo archivos
de 5 MB, que en Render son 512 MB de memoria en total. Si se toca ese número, medirlo: 21 subidas
seguidas tienen que acabar en 429, y hay que **borrar del bucket lo que suba la prueba**.

**Secretos (`secretos` en rojo).** Un commit nuevo no borra nada: hay que reescribir el
historial (`git filter-branch`) y luego forzar el push, y aun así hay que dar la clave por
quemada y rotarla. Los contactos reales viven en `frontend/.env` y en las variables del
hosting; en el código solo valores de ejemplo evidentes.

## Lo que esto no ve

Vale la pena decírselo al usuario en vez de dejar que se confíe:

- **Las cuentas**: quién entra a Supabase, Vercel y GitHub, si tienen segundo factor, qué
  permisos tienen los tokens. Eso se revisa a mano, en cada panel.
- **Las cabeceras de la web publicada**, salvo que se pase `SEG_URL_PUBLICA`.
- **La contraseña del administrador**: que sea buena y que no se repita en otro sitio.
- **Escritura en Supabase desde fuera**: no se prueba a propósito (tocar
  `flyway_schema_history` dejaría el backend sin arrancar). Se comprueba en el panel.
- **Análisis estático del código** (Semgrep, CodeQL): no están instalados. Si algún día
  hacen falta, las skills de Trail of Bits (`static-analysis`, `insecure-defaults`,
  `sharp-edges`) se instalan con `/plugin marketplace add trailofbits/skills`. Decisión del
  usuario, no automática.
- **OWASP ZAP** (escaneo pasivo del sitio entero) necesita Docker en marcha; opcional:
  `docker run --rm -t ghcr.io/zaproxy/zaproxy zap-baseline.py -t https://tu-web`.

## Reglas al usar esta skill

1. **Antes de tocar nada, medir.** Y guardar el número: «12 intentos, ni un 429» vale más
   que «el freno no funciona».
2. **Después de arreglar, volver a medir con el mismo control.** Si pasa sin haber cambiado
   nada de fondo, el control está mal: arreglar el control.
3. **Nunca aflojar un control para que pase.** Si da un falso positivo, se corrige el
   control y se anota en `TRAMPAS.md`.
4. **No probar nada destructivo** sobre datos reales: ni escribir en Supabase, ni borrar
   cuadros, ni inundar el servidor. Los controles de escritura se hacen sin permiso a
   propósito, para que fallen antes de tocar nada.
5. **Informe sin tecnicismos.** Qué puede pasar, a quién le pasa y qué se hizo. Los
   identificadores de aviso (GHSA-…) solo si el usuario los pide.
6. **No hacer commit ni push** (regla del proyecto, en `CLAUDE.md`).
