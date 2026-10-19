# Pruebas de AGP Desing

Estado de las pruebas automáticas y qué cubren. Auditoría y ampliación de octubre de 2026.

## Resumen

| | Antes | Después | Archivos |
|---|---|---|---|
| **Frontend** (Vitest, modo demo) | 76 casos / 20 archivos | **102 casos / 24 archivos** | +26 casos |
| **Backend** (JUnit, sin BD) | 132 `@Test` / 15 clases | **171 `@Test` / 20 clases** | +39 métodos (53 ejecuciones) |

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

Puntos a mejorar detectados (no corregidos aún, anotados como pendientes):

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

## Huecos pendientes (siguiente tanda)

- **Frontend**: `services/remoto/api.ts` (cabecera `Authorization` y manejo de errores del cliente
  HTTP), hooks sin test (`useAuth`, `usePageTitle`, `useSeo`, `useSettings`), y los casos límite que
  faltan en `dinero.test.ts`. `lib/sonido.ts` necesita mockear `AudioContext` (coste alto, baja
  prioridad); `lib/movimiento.ts` y `config/enlaces.ts` son solo constantes y no valen test.
- **Backend**: las fronteras que faltan en `SaleTest` y arreglar la prueba floja de
  `ReglasDelDominioTest`; auditar a fondo los tests de casos de uso e infraestructura.

## Reglas al tocar las pruebas

- Nunca aflojar un control para que pase; si da un falso positivo, se arregla el control y se anota
  en `.claude/skills/*/TRAMPAS.md` (ya existe para QA y seguridad).
- Los tests de `domain/` y `application/` son POJO puros: sin Spring, JPA ni Jackson
  (`CleanArchitectureTest` lo verifica).
- Frontend: tests junto al código (`*.test.ts[x]`), estilo `import { describe, expect, it } from 'vitest'`.
