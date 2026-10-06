# AGP Desing — guía para Claude Code

Proyecto full-stack de **AGP Desing** (la marca se escribe así, con "Desing"; no corregirla): catálogo de cuadros pintados a mano con cotización por WhatsApp y panel admin.

Idioma de trabajo: **español** con el usuario. Código y comentarios en español donde ayuden; nombres de clases/variables en inglés.

## Estructura

```
agp-desing/
├── frontend/    React 19 + TypeScript + Vite 8 + Tailwind v4 + React Router 7 + Motion
├── backend/     Java 21 + Spring Boot 3.5 + PostgreSQL + Flyway + JWT — Clean Architecture
├── docs/        ARQUITECTURA.md (capas, patrones, recetas), plan-agp-design.md (plan original), DEPLOY.md, brand/, qa/
├── .github/workflows/keep-alive.yml   ping diario a Supabase; ping a Render cuando exista BACKEND_URL
└── .claude/skills/   frontend-design, ui-ux-pro-max, humanizer, emil-design-eng, animate,
                      review-animations, find-animation-opportunities, web-design-guidelines,
                      playwright-cli, qa-suite, security-audit, redesign-existing-projects
```

Front y back **nunca se mezclan**: cada uno tiene su `package.json`/`pom.xml`, su `.env.example` y su `.gitignore`. El contrato entre ambos son `frontend/src/types/product.ts` ↔ `ProductResponse.java` y `frontend/src/types/settings.ts` ↔ `SiteSettingsResponse.java` (ambos en `backend/.../presentation/dto/response/`) — si cambia uno, cambia el otro.

## Comandos

```bash
# Frontend
cd frontend && npm install
npm run dev          # http://localhost:5173 — sin VITE_API_URL arranca en MODO DEMO (datos locales, admin/demo)
npm run build        # tsc -b && vite build — debe pasar antes de cualquier entrega
npm run lint         # oxlint
npm test             # Vitest: modo demo, caché del catálogo, sesión, navegación (siempre en modo demo)
npm run qa:shots     # capturas a 375/768/1440 en docs/qa/ (necesita dev server y Edge/Chrome); git solo guarda las de escritorio
npm run qa           # suite de calidad: accesibilidad, contraste, pantallas, enlaces, textos, Lighthouse
npm run qa:rapido    # lo mismo sin Lighthouse (~90 s)
npm run qa:muerto    # archivos, exports, dependencias y estilos que ya no usa nadie
npm run seg          # auditoría de seguridad: secretos, librerías, cabeceras, Supabase, permisos, login
npm run seg:rapido   # lo mismo sin el control de librerías (que compila con Maven)

# Backend (requiere JDK 21 y Docker; Maven NO: ./mvnw lo descarga solo la primera vez)
cd backend && docker compose up -d       # Postgres local (puerto 5432, BD/usuario "agp")
cp .env.example .env                     # rellenar JWT_SECRET y ADMIN_PASSWORD_HASH
.\mvnw.cmd test                          # ArchUnit + casos de uso + contrato HTTP (ApiContractTest), sin BD
.\run-dev.ps1                            # carga .env y hace mvnw spring-boot:run → http://localhost:8080
.\mvnw.cmd test -Dtest=CreateProductUseCaseTest # un solo test
```

En Linux/macOS usar `./mvnw` en lugar de `.\mvnw.cmd`. Spring Boot **no lee `.env`** por sí solo: `application.yml` solo tiene `${VARS}`, así que las variables deben estar en el entorno del proceso. `run-dev.ps1` las carga desde `backend/.env`; sin él, exportarlas a mano antes de `mvnw spring-boot:run`.

Para conectar el front al back: `frontend/.env` con `VITE_API_URL=http://localhost:8080` y en el back `CORS_ALLOWED_ORIGIN=http://localhost:5173`.

Las fotos del panel se suben a **Supabase Storage** (`POST /api/imagenes`), no al disco: en Render se borraría en cada despliegue. Hace falta el bucket público `productos` y `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` en `backend/.env` (ver `docs/DEPLOY.md`). Sin eso la web funciona igual y solo la subida responde «no está configurado».

La base de datos real está en **Supabase** (Session pooler, ver `docs/DEPLOY.md`); el Postgres de `docker compose` es solo respaldo local. Producción (Render + Vercel) está preparada pero **no desplegada**: no proponer deploy salvo que el usuario lo pida.

## Reglas de diseño (frontend)

- Cargar `frontend-design` antes de tocar UI. Pasar el AI Slop Test: nada de tarjetas iguales con sombra, gradientes morados, Inter/Roboto/Arial, todo centrado.
- Tokens en `frontend/src/index.css` (`@theme`). Rojo de marca `#7e0e0e` (del logo) es el único acento fuerte; paleta del cliente en `docs/brand/paleta.png`. No inventar colores nuevos.
- **Web pública: sistema «Capas»** (skill `redesign-existing-projects`, rediseño de sept. 2026). La web se construye como un cuadro 3D: fondo de papel con grano, hojas superpuestas y la foto montada encima. Todo cuelga de la clase `sitio` en `<html>` (así llega también a los portales): `main.tsx` la pone antes del primer dibujado si la ruta no es `/admin` (si no, el navegador pedía Cormorant sin usarla) y `PublicLayout` la pone y quita al pasar entre la web y el panel: **el panel no la lleva y no debe cambiar ni un píxel**. Por eso no se tocan las piezas compartidas (`--font-display` de `@theme`, `.label`, `.btn-*`, `.field-*`); la web usa las suyas (`.papel`, `.paspartu`, `.mat`, `.pestana`, `.separador`, `.boton`, `.enlace-flecha`, `.montada`, `.esqueleto`, en `index.css`).
  - Una sola luz, arriba a la izquierda: sombras `--capa-1/2/3` hacia abajo a la derecha, teñidas de bordeaux, nunca negras. El grano va de fondo, nunca encima del texto.
  - Una hoja con pestaña (`.pestana`) va en nude (`.paspartu`): silk sobre la página silk no se distingue y la pestaña parece texto suelto. Dentro de una hoja nude, el paspartú de las obras pasa a silk (`.mat` + `.hoja-catalogo`).
  - Sin rótulos en mayúsculas encima de los títulos, sin frases unidas con «·», sin dos botones rellenos juntos (botón + `enlace-flecha`), sin acordeones para textos cortos.
  - Iconos de la web: los de `components/ui/iconos.tsx` (trazo 1.75). Lucide solo en el panel.
  - El menú en línea aparece desde `lg`: en tablet los cinco enlaces se partían en dos líneas.
- Fuentes: en la web pública, **Fraunces** (títulos) y Manrope (texto). Fraunces va **recortada** con fontTools: SOFT fijo en 100, WONK en 0, peso 400–600 y sin cursiva (52 KB en vez de 119 + 147). Un peso fuera de ese tramo o la cursiva exigen rehacer el archivo (receta en `src/fonts.css`), no cambiar solo el CSS. Cormorant Garamond queda para el logotipo (`--font-marca`, igual en web y panel) y los títulos del panel; JetBrains Mono, solo en el panel. Ninguna más.
- La "pared de galería" (`ProductGrid` + `ProductCard`) es la pieza distintiva: cada obra en su paspartú, con el Nº y el estado anotados en el margen de abajo, y alturas escalonadas. No convertirla en grid uniforme.
- **Las fotos se eligen del ordenador, no se pega una URL.** `SubirImagen` (en `components/admin/`) es el único campo de imagen del panel: sube el archivo y deja la dirección. Se manda **tal cual, sin recomprimir**; el backend le quita los metadatos (ubicación GPS, modelo del teléfono) sin tocar los píxeles y guarda con nombre UUID. El tope de peso se avisa antes de enviar y sale de `VITE_MAX_IMAGEN_MB`, que debe coincidir con `MAX_IMAGEN_MB` del backend. `img-src` de la CSP necesita `blob:` para la vista previa.
- **Las fotos no se recortan nunca.** La tarjeta toma su proporción de la imagen (`onLoad` → `naturalWidth/naturalHeight`), usando los centímetros solo como estimación mientras carga; la ficha usa `object-contain`. Antes la caja salía de `widthCm/heightCm` y con `object-cover` llegó a comerse el 38 % de una foto.
- La portada es **editorial** (titular tipográfico), no una foto a pantalla con capa oscura. A su lado, la caja de sombra con un **carrusel** (`sections/CarruselPortada.tsx`): la imagen de `/admin/portada` (`GET/PUT /api/settings`) si la hay, y luego las obras más recientes, hasta 6 (`MAX_FOTOS` en `Hero.tsx`). Escenario cuadrado con `object-contain` (las fotos no se recortan y la caja no salta entre fotos verticales y horizontales). Pulsar la foto lleva a `/catalogo`; deslizar en el móvil cambia de foto sin navegar. Pasa sola cada 5 s y **tiene que poder pararse** (botón de pausa, y se para al pasar el ratón o con el foco en los controles: WCAG 2.2.2); con *reduced motion* no pasa sola.
- `--color-greige` es para bordes y líneas: sobre `silk` da 2:1 y no vale para texto (usar `ink-soft`).
- Motion: `animate` → `emil-design-eng`. Solo `transform`/`opacity`, curva `--ease-out`, UI < 300 ms, hero/scroll ≤ 800 ms, `scale(0.97)` en `:active`, nunca `ease-in` ni `transition: all`. Transforms como string (`transform: 'translateY(0px)'`), no `y: 0`.
- Antes de entregar UI nueva: invocar `review-animations` por nombre (no se auto-invoca) y corregir todo Block.
- **Tres animaciones con reglas propias.** (1) Catálogo ↔ ficha: la foto viaja con las View Transitions del navegador (`viewTransition` en los `<Link>` de React Router). El nombre `foto-obra` solo lo lleva la foto que viaja (`useViewTransitionState`); si lo llevaran dos a la vez, no se anima ninguna. La ficha recibe el producto por `state` para pintarse con la foto desde el primer instante, y su foto no usa `Reveal`. 360 ms con `--ease-in-out` (`index.css`). (2) La foto de la ficha se amplía con `react-medium-image-zoom`; el marco hueso va en `.foto-ficha > [data-rmiz]` y no en la figura, porque con la figura ajustada al contenido la foto medía 0 × 0. (3) Al filtrar el catálogo, `ProductGrid` recoloca con `layout="position"` (nunca `layout` a secas: deforma fotos de proporciones distintas) y `AnimatePresence mode="popLayout"`. Las tres se desactivan con *reduced motion*.
- `useProducts` guarda la última lista entre páginas y `ScrollManager` recuerda la posición de cada página: al volver (botón «atrás» o enlace de la ficha con `state.volver`) el catálogo aparece donde se dejó. `ScrollManager` pone `history.scrollRestoration = 'manual'`: con `auto` el navegador volvía a desplazar la página después y la dejaba 5–9 px corrida. La posición se apunta **mientras se hace scroll**, no al salir: al salir, la ficha (más corta) ya está puesta y el navegador ya ha recortado el scroll; guardar ese valor dejaba la obra 244 px más abajo al volver (`ScrollManager.test.tsx`). `ProductCard` guarda la proporción medida de cada foto para que al volver las tarjetas no cambien de alto.
- Antes de publicar: `npm run qa` (skill `qa-suite`). Nunca aflojar un control para que pase; si da un falso positivo, se arregla el control y se anota en `.claude/skills/qa-suite/TRAMPAS.md`.
- Tipografías servidas desde `/fonts` (ver `src/fonts.css`). No volver a enlazar Google Fonts: metería un tercero más. El único servidor ajeno que toca el navegador del visitante es el almacén de fotos de Supabase, y está declarado en la política de privacidad; cualquier otro hay que declararlo antes de añadirlo.
- Copy en español, tono de taller pequeño. Pasar por `humanizer`: sin "vibrante", "innovador", "único en su tipo", tríadas ni guiones largos decorativos.

## Reglas de arquitectura (frontend)

Mapa completo, patrones y recetas en `docs/ARQUITECTURA.md`.

- Los datos pasan por `services/contratos.ts`: cada recurso tiene su contrato y dos implementaciones,
  `services/demo/` (en memoria) y `services/remoto/api.ts` (una línea por endpoint, sin lógica).
  `crearServicios` (en `services/servicios.ts`) elige **una sola vez, al cargar el módulo**; nunca
  llamarla desde un componente o un hook: crearía otro almacén demo y se perderían las obras del panel.
- Pedir una cosa al servidor: `useRecurso`. Lo que una página le pasa a otra al navegar: `lib/navegacion.ts`
  (nunca `state as {...}` suelto). Errores: `lib/errores.ts`. Título de la pestaña: `usePageTitle`.
- Escritos una sola vez: enlaces del menú, pie y redes en `config/enlaces.ts`; curvas de Motion en
  `lib/movimiento.ts` (son las de `index.css`: si cambia una, cambia la otra).
- Pruebas con Vitest junto a lo que prueban (`*.test.ts[x]`). Las rutas de `scripts/qa/*` están
  escritas a mano: mover archivos exige revisar esos scripts.

## Reglas de arquitectura (backend)

- `domain/` y `application/` **sin imports de Spring, JPA, validación, Jackson, JJWT, servlets ni bucket4j**. `CleanArchitectureTest` lo verifica; si falla, no se mergea.
- Los casos de uso son POJOs cableados en `infrastructure/config/UseCaseConfig`. Si comprueban algo y luego guardan (nombre repetido + guardar), van dentro de `Transacciones` (puerto de `application/port/out`, implementado en `infrastructure/persistence/SpringTransacciones`).
- Errores por capa: los del negocio heredan de `DomainException` (`domain/exception`), los de los casos de uso de `ApplicationException` (`application/exception`). Ninguno sabe de HTTP; la traducción a códigos vive solo en `GlobalExceptionHandler`. ArchUnit comprueba la herencia.
- Cada regla de un dato vive en el dominio (`UrlPublica`, `Product.DIMENSION_MAX`…) y los DTO toman sus límites de esas constantes, no de números repetidos. El paso JSON ↔ núcleo, en `presentation/mapper/`.
- Un formato de imagen nuevo = una clase `Limpiador<Formato>` (Strategy); el `switch` de `LimpiadorDeMetadatos` no compila sin ella.
- JPA vive solo en `infrastructure/persistence/`. `ProductJpaEntity` ≠ `domain.model.Product`; el mapper los traduce.
- Esquema con Flyway (`ddl-auto: validate`). Nueva columna = nueva migración `V<n>__*.sql`, nunca editar una aplicada.
- Secretos solo por variables de entorno (`application.yml` únicamente tiene `${VARS}`). `VITE_*` es público, no secreto.
- Seguridad: stateless + JWT en header Bearer; CSRF deshabilitado por eso mismo; CORS a un solo origen exacto con `allowCredentials(false)`; login con rate limit 5/min/IP.

## Reglas de seguridad

- Solo se aceptan JPG, PNG y WebP al subir, reconocidos **por sus primeros bytes** (el tipo que declara el navegador se puede falsear). SVG rechazado a propósito: es texto y puede llevar scripts en un bucket público. La clave secreta de Supabase vive solo en `backend/.env` y en Render; nunca en `VITE_*`, que es público.
- Antes de publicar: `npm run seg` (skill `security-audit`). Nunca aflojar un control para que
  pase; si da un falso positivo, se arregla el control y se anota en
  `.claude/skills/security-audit/TRAMPAS.md`.
- El freno del login cuenta por IP **de la conexión**. `X-Forwarded-For` solo se lee cuando
  `TRUSTED_PROXY_HOPS` dice cuántos proxies propios hay delante (0 en local; en Render, el número
  de proxies, que hay que confirmar tras desplegar — ver `docs/DEPLOY.md`):
  esa cabecera la escribe quien llama y falsearla saltaba el freno por completo.
- Cabeceras de la web en `frontend/vercel.json`; las de la API, en el bloque `.headers(...)` de
  `SecurityConfig`. En la CSP, nunca `unsafe-eval` ni `unsafe-inline` en `script-src`. Al tocar la
  CSP, `npm run seg:csp`: compila, sirve la web con esas cabeceras (`vite.config.ts` las lee de
  `vercel.json` y las aplica en `preview`, nunca en `dev`) y comprueba con un navegador que
  ninguna página se queda en blanco.
- Toda tabla nueva en Supabase nace con RLS activado, incluidas las que crean las herramientas.
  Se arregla en el SQL Editor con el backend parado, **nunca en una migración de Flyway**
  (`flyway_schema_history` está bloqueada mientras migra). Revisar Supabase → Advisors → Security.
- Dependencias del backend: parchear con una propiedad en `pom.xml` (`tomcat.version`,
  `jackson-bom.version`, `log4j2.version`, `postgresql.version`) y anotar el motivo; al subir de
  versión de Spring Boot, comprobar si ya sobran. En la web, **nunca `npm audit fix --force`**:
  los avisos abiertos son de herramientas de desarrollo y ese comando rompe la suite de QA.

## Estado y pendientes

Ver `docs/plan-agp-design.md` § Fases. Pendientes conocidos: logo con fondo transparente (el actual es PNG con rojo), fotos reales de las obras (las SVG en `frontend/public/images/obras/` son de muestra). Los contactos reales (WhatsApp, Instagram, TikTok, correo) **no se guardan en el repositorio**: viven en `frontend/.env` y en las variables del hosting. `src/config/env.ts` y `.env.example` solo llevan valores de ejemplo evidentes. No volver a escribir los reales en el código. El negocio es peruano: precios en soles (`PEN`, centavos en `priceCents`), formato `es-PE`.

## Git

**No se hace `commit` ni `push` sin que el usuario lo pida explícitamente.** Los cambios se quedan
en el árbol de trabajo y él decide cuándo guardarlos y cuándo subirlos. Vale también para ramas,
`tag` y cualquier cosa que toque el repositorio remoto.
