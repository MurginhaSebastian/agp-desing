# AGP Desing — guía para Claude Code

Proyecto full-stack de **AGP Desing** (la marca se escribe así, con "Desing"; no corregirla): catálogo de cuadros pintados a mano con cotización por WhatsApp y panel admin.

Idioma de trabajo: **español** con el usuario. Código y comentarios en español donde ayuden; nombres de clases/variables en inglés.

## Estructura

```
agp-desing/
├── frontend/    React 19 + TypeScript + Vite 8 + Tailwind v4 + React Router 7 + Motion
├── backend/     Java 21 + Spring Boot 3.3 + PostgreSQL + Flyway + JWT — Clean Architecture
├── docs/        plan-agp-design.md (arquitectura completa), PROMPT-MAESTRO.md, brand/, qa/
└── .claude/skills/   frontend-design, ui-ux-pro-max, humanizer, emil-design-eng, animate,
                      review-animations, find-animation-opportunities, web-design-guidelines,
                      playwright-cli, shadcn-ui
```

Front y back **nunca se mezclan**: cada uno tiene su `package.json`/`pom.xml`, su `.env.example` y su `.gitignore`. El contrato entre ambos es `frontend/src/types/product.ts` ↔ `backend/.../presentation/dto/response/ProductResponse.java` — si cambia uno, cambia el otro.

## Comandos

```bash
# Frontend
cd frontend && npm install
npm run dev          # http://localhost:5173 — sin VITE_API_URL arranca en MODO DEMO (datos locales, admin/demo)
npm run build        # tsc -b && vite build — debe pasar antes de cualquier entrega
npm run lint         # oxlint
npm run qa:shots     # capturas a 375/768/1440 en docs/qa/ (necesita dev server y Edge/Chrome)

# Backend (requiere JDK 21 y Docker; Maven NO: ./mvnw lo descarga solo la primera vez)
cd backend && docker compose up -d       # Postgres local (puerto 5432, BD/usuario "agp")
cp .env.example .env                     # rellenar JWT_SECRET y ADMIN_PASSWORD_HASH
.\mvnw.cmd test                          # ArchUnit (capas) + tests de casos de uso, sin BD
.\run-dev.ps1                            # carga .env y hace mvnw spring-boot:run → http://localhost:8080
.\mvnw.cmd test -Dtest=CreateProductUseCaseTest # un solo test
```

En Linux/macOS usar `./mvnw` en lugar de `.\mvnw.cmd`. Spring Boot **no lee `.env`** por sí solo: `application.yml` solo tiene `${VARS}`, así que las variables deben estar en el entorno del proceso. `run-dev.ps1` las carga desde `backend/.env`; sin él, exportarlas a mano antes de `mvnw spring-boot:run`.

Para conectar el front al back: `frontend/.env` con `VITE_API_URL=http://localhost:8080` y en el back `CORS_ALLOWED_ORIGIN=http://localhost:5173`.

## Reglas de diseño (frontend)

- Cargar `frontend-design` antes de tocar UI. Pasar el AI Slop Test: nada de tarjetas iguales con sombra, gradientes morados, Inter/Roboto/Arial, todo centrado.
- Tokens en `frontend/src/index.css` (`@theme`). Rojo de marca `#7e0e0e` (del logo) es el único acento fuerte; paleta del cliente en `docs/brand/paleta.png`. No inventar colores nuevos.
- Fuentes: Cormorant Garamond (display), Manrope (cuerpo), JetBrains Mono (etiquetas de museo). Solo esas tres.
- La "pared de galería" (`ProductGrid` + `ProductCard`) es la pieza distintiva: cada cuadro a su proporción real, etiqueta debajo, alturas escalonadas. No convertirla en grid uniforme.
- Motion: `animate` → `emil-design-eng`. Solo `transform`/`opacity`, curva `--ease-out`, UI < 300 ms, hero/scroll ≤ 800 ms, `scale(0.97)` en `:active`, nunca `ease-in` ni `transition: all`. Transforms como string (`transform: 'translateY(0px)'`), no `y: 0`.
- Antes de entregar UI nueva: invocar `review-animations` por nombre (no se auto-invoca) y corregir todo Block.
- Copy en español, tono de taller pequeño. Pasar por `humanizer`: sin "vibrante", "innovador", "único en su tipo", tríadas ni guiones largos decorativos.

## Reglas de arquitectura (backend)

- `domain/` y `application/` **sin imports de Spring, JPA, Jackson ni JJWT**. `CleanArchitectureTest` lo verifica; si falla, no se mergea.
- Los casos de uso son POJOs cableados en `infrastructure/config/UseCaseConfig`.
- JPA vive solo en `infrastructure/persistence/`. `ProductJpaEntity` ≠ `domain.model.Product`; el mapper los traduce.
- Esquema con Flyway (`ddl-auto: validate`). Nueva columna = nueva migración `V<n>__*.sql`, nunca editar una aplicada.
- Secretos solo por variables de entorno (`application.yml` únicamente tiene `${VARS}`). `VITE_*` es público, no secreto.
- Seguridad: stateless + JWT en header Bearer; CSRF deshabilitado por eso mismo; CORS a un solo origen exacto con `allowCredentials(false)`; login con rate limit 5/min/IP.

## Estado y pendientes

Ver `docs/plan-agp-design.md` § Fases. Pendientes conocidos: logo con fondo transparente (el actual es PNG con rojo), fotos reales de las obras (las SVG en `frontend/public/images/obras/` son de muestra). WhatsApp (+51 977 463 110), Instagram (`agp_desinger`) y TikTok (`@agp.desing`) reales ya están como valores por defecto en `frontend/src/config/env.ts` y en `.env.example`. Ojo: el número es de Perú pero precios y copy están en COP/Colombia; confirmar con el cliente.
