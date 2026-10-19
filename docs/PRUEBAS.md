# Pruebas de AGP Desing

Estado de las pruebas automáticas y qué cubren. Auditoría y ampliación en tres tandas, octubre de 2026.

## Resumen

| | Antes | Después | Añadido |
|---|---|---|---|
| **Frontend** (Vitest, modo demo) | 76 casos / 20 archivos | **162 casos / 30 archivos** | +86 casos |
| **Backend** (JUnit, sin BD) | 132 `@Test` / 15 clases | **264 `@Test` / 23 clases** | +132 métodos |

La suite backend completa ejecuta **311** pruebas (los parametrizados y ArchUnit expanden `@Test`):
`.\mvnw.cmd test` → `Tests run: 311, Failures: 0` / BUILD SUCCESS.

Además, sin contar aquí: `CleanArchitectureTest` (ArchUnit, verifica la regla de dependencias) y
`ApiContractTest` (contrato HTTP del backend).

## Cómo correr

```bash
# Frontend (rápido, no necesita backend)
cd frontend && npx vitest run              # toda la suite
npx vitest run src/lib/dinero.test.ts      # un archivo

# Backend (JDK 21; no necesita Docker: estos tests no tocan BD)
cd backend && .\mvnw.cmd test              # toda la suite
.\mvnw.cmd test -Dtest=MoneyTest           # una clase
```

## Evaluación de la suite que ya existía

**Veredicto: sólida en lo que cubre, con huecos concretos.** No se reescribió nada: lo que había
está bien planteado (fronteras exactas, se comprueba el campo que falla y no solo que lance).

Puntos a mejorar detectados en la auditoría — **todos corregidos en la segunda tanda**:

- **Backend**
  - `domain/ReglasDelDominioTest.java`: la prueba `direccionDeMasDe500CaracteresSeRechaza` es
    parametrizada con un `if` dentro y el nombre promete solo el caso de rechazo; se lee mal y no
    prueba ningún valor intermedio (11–499), así que no distingue un tope de 500 de uno mayor.
  - `domain/SaleTest.java`: no cubre los topes de `item` (120), `detail` (2000), `customerName` (80)
    ni `quantity` (99/100), ni `update()`, `rehydrate()`, `cancelled()`, ni los teléfonos de 9 y 15
    dígitos (las fronteras exactas: solo prueba 8 y 16).
  - No se auditaron a fondo los tests de casos de uso, infraestructura, contrato HTTP, rate limit ni
    CSV; solo se inventariaron.
- **Frontend**
  - `lib/dinero.test.ts`: falta `aCentimos` con negativos y con más de dos decimales (redondeo), y
    `aTextoDeSoles` con 0 y con un solo céntimo.
  - Solo se auditaron por dentro `fotos.test.ts` y `dinero.test.ts`; el resto se juzgó por inventario.

## Lo que se añadió

### Backend (`backend/src/test/java/com/agpdesing/`)
- `domain/MoneyTest.java` — rechaza 0, negativos y `Long.MIN_VALUE`; acepta 1 y `Long.MAX_VALUE`;
  moneda nula; igualdad.
- `domain/UrlPublicaTest.java` — recorte de espacios, nulo, esquemas (`HTTP://`, `data:`, `mailto:`,
  `ftp://`), tope de 500 exacto, longitud medida sin espacios.
- `domain/ProductTest.java` — `slugify` (tildes, ñ, signos, bordes), `create`/`rehydrate`, topes de
  nombre/descripción/técnica, medidas ≤ 0, `update` conserva el slug, `changeStatus`, `seLlamaComo`,
  `elegirSlugLibre`.
- `domain/IdentidadesTest.java` — `ProductId`, `SaleId`, `AdminUser`, `SiteSettings` (nulos, UUID
  inválido, `empty`, `hasHeroImage`).
- `presentation/mapper/DtoMappersTest.java` — los cuatro mappers (productId nulo vs UUID, entrega
  opcional, saldo, mes `"2026-10"`, top de ítems con y sin obra).

### Frontend (`frontend/src/`)
- `api-vercel/sitemap.test.ts` — `construirSitemap` y el handler `GET` de la función de Vercel:
  páginas fijas sin `/admin`, `lastmod` por día, obras sin slug descartadas, escapado; `GET` sin
  `VITE_API_URL`, limpieza de la URL, 503 con `Retry-After` si el backend falla.
- `api-vercel/obra.test.ts` — tarjeta al compartir (`tarjetaDeObra`, `paginaDeTarjeta`, `GET`):
  imagen absoluta vs relativa, copia reducida con prioridad, resumen cortado a 200, escapado HTML
  contra inyección, `GET` que usa `.min.jpg` si el HEAD responde y la original si da 404.
- `lib/descarga.test.ts` — el enlace se pulsa con el nombre dado, sale del DOM y se libera el `blob:`.
- `config/env.test.ts` — modo demo, `apiUrl` limpia, WhatsApp solo dígitos, `contactosSinConfigurar`,
  `maxImagenMb` con valor válido/basura/0.

Detalle técnico: los tests de las funciones de Vercel viven en `src/api-vercel/` (no en `api/`)
porque `vite.config.ts` solo incluye `src/**/*.test.*`; importan `../../api/...` y llevan
`/// <reference types="node" />` para que `tsc -b` no se queje de `process`.

### Segunda tanda (los huecos de la auditoría)

- **Frontend**
  - `services/remoto/api.test.ts` (18 casos) — el cliente HTTP real con `fetch` mockeado: cabecera
    `Authorization: Bearer` (se envía con sesión, no en rutas públicas ni con token caducado), forma
    de las peticiones (JSON, `FormData` sin `Content-Type` manual, `Blob` al exportar, 204 →
    `undefined`), errores (`ApiError` con status/detail/`fieldErrors`, cuerpo no-JSON, fallo de red),
    y el 401 con `auth` que borra la sesión y dispara `unauthorizedEvent` (no en el login).
  - `hooks/useSettings.test.tsx` (6), `hooks/usePageTitle.test.tsx` (4), `hooks/useSeo.test.tsx`
    (12, incluye `resumen`), `hooks/useAuth.test.tsx` (2) — los hooks que faltaban.
  - `lib/dinero.test.ts` (+3) — redondeo de más de dos decimales, negativos, `aTextoDeSoles` con 0 y
    con un céntimo.
- **Backend**
  - `domain/SaleTest.java` (+14 métodos) — topes exactos de `item`/`detail`/`customerName`/`quantity`
    (desde las constantes del dominio), teléfonos de 9 y 15 dígitos, `update()`, `rehydrate()`,
    `cancelled()`.
  - `domain/ReglasDelDominioTest.java` — la prueba floja (`if` dentro, nombre engañoso) se reemplazó
    por tres honestas: hasta 500 vale (20/250/500), 501 se rechaza en la foto (`imageUrl`) y en la
    portada (`heroImageUrl`).

### Tercera tanda (auditoría a fondo y un bug de seguridad)

- **Bug de seguridad arreglado** en `security/tokenStorage.ts` (`get()`): una sesión con fecha de
  caducidad **ilegible** no caducaba nunca (`Date.parse` → `NaN`, y `NaN <= now` es `false`, así que
  el token se aceptaba para siempre). Lo destapó la auditoría de la suite. Corregido (solo vale si
  caduca en el futuro) con su prueba en `tokenStorage.test.ts`. Poco probable en producción (el
  servidor manda un ISO válido), pero rompía la regla de cerrar la sesión caducada.
- **Frontend**: `lib/sonido.test.ts` (12) — el pop al pulsar: crea el AudioContext y suena en
  botón/enlace, no suena en `div`/`aria-disabled`/`disabled`/`label`, sin Web Audio no rompe, y la
  limpieza quita el escuchador. `security/tokenStorage.test.ts` (+3, incluye el caso del bug).
- **Backend (+76 métodos)**: auditoría caso por caso de casos de uso, infraestructura y presentación.
  Nuevas: `application/ProductUseCasesCasosLimiteTest`, `application/SalesUseCasesCasosLimiteTest`,
  `presentation/ratelimit/LimitadorPorClaveTest` (caducidad del mapa de contadores). Ampliadas:
  `SalesUseCasesTest` (ramas de editar venta y del resumen), `ReductorImageIOTest` (las 8
  orientaciones EXIF, antes solo 1), `ApiContractTest` (ventas por id, límite de 731 días, 409 al
  renombrar), `AuthenticateAdminUseCaseTest` (usuario inexistente de verdad, límite de 72 bytes),
  `ProductRepositoryImplTest`, `SubirImagenTest`, `SiteSettingsUseCasesTest`, `AtomicidadTest`,
  `ClientIpResolverTest`, `VentasCsvTest`.

### Comportamientos que los tests dejan fijados (a saber)
- `aCentimos('-5')` devuelve `500`: el signo se descarta como cualquier símbolo, así que un precio
  negativo se vuelve positivo en silencio. Es coherente con su documentación.
- El 401 solo cierra la sesión si la petición lleva `auth: true`; un 401 en el login **no** dispara
  `unauthorizedEvent`, a propósito.

### Observaciones del backend
- **Arreglado** — `SalesSummaryUseCase.masVendido` agrupa ahora con `toLowerCase(Locale.ROOT)`, así no
  depende del locale del servidor (en turco «Seda I» y «seda i» dejarían de agruparse), igual que
  `Product.slugify`.
- **Arreglado** — el 415 ya no responde siempre con el mensaje de subida de archivo: dice qué tipo de
  contenido se esperaba (multipart en `/api/imagenes`, JSON en el resto). Con sus pruebas en
  `ApiContractTest` (`sinFormularioEs415`, `el415DeOtroEndpointDaSuPropioTipoNoElDeArchivo`).
- Se deja a conciencia: los dobles en memoria de los tests mutan el objeto al hacer `Product.update`,
  así que la atomicidad de una edición a medias solo la garantiza el rollback real de JPA, no los
  dobles. No es un bug de producción.

## Huecos pendientes

Prácticamente nada de valor. Queda, si algún día se quiere: fijar en un test el mensaje del 415 y el
`strip()` de `Sale` antes de medir longitudes; `lib/movimiento.ts` y `config/enlaces.ts` son solo
constantes y no valen test; el `AuthProvider` completo y el router no hacen falta como unidad.

## Reglas al tocar las pruebas

- Nunca aflojar un control para que pase; si da un falso positivo, se arregla el control y se anota
  en `.claude/skills/*/TRAMPAS.md` (ya existe para QA y seguridad).
- Los tests de `domain/` y `application/` son POJO puros: sin Spring, JPA ni Jackson
  (`CleanArchitectureTest` lo verifica).
- Frontend: tests junto al código (`*.test.ts[x]`), estilo `import { describe, expect, it } from 'vitest'`.
