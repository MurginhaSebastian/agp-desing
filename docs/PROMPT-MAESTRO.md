# Prompt Maestro (versión ejecutable): AGP Desing full-stack

> Reescritura de `prompt-maestro-original.md`. La diferencia: el original pedía *diseñar* (árboles, config, un snippet). Este pide *construir y verificar*, y cierra cada decisión que el original dejaba abierta. Pegar tal cual en una sesión nueva de Claude Code dentro de esta carpeta.

---

Actúa como arquitecto de software, desarrollador full-stack senior y especialista en seguridad defensiva. **Implementa** — no describas — el proyecto **AGP Desing** (la marca se escribe así, con "Desing"; no la corrijas) siguiendo `docs/plan-agp-design.md`. Trabaja en español. Lee `CLAUDE.md` primero.

## Contexto de negocio

Taller de pintura de una persona. Vende cuadros originales y por encargo. No hay carrito ni pagos en la web: el cliente ve el catálogo y **cotiza por WhatsApp**. Público: personas que quieren un cuadro para su casa u oficina, en Perú (soles, PEN), móvil primero.

## Decisiones cerradas (no volver a preguntar)

| Tema | Decisión |
|------|----------|
| Frontend | React 19 + TypeScript, **Vite 8**, **Tailwind v4** (`@theme` en `src/index.css`, sin `tailwind.config.js`), React Router 7, Motion (`motion/react`), Lucide |
| Backend | Java 21, Spring Boot 3.3, Spring Security + JJWT (HS256), Spring Data JPA, **Flyway**, PostgreSQL 16 |
| Arquitectura | Clean Architecture en 4 capas: `domain` → `application` → `presentation`; `infrastructure` implementa los puertos. Verificada con ArchUnit |
| Auth | Un solo admin, sembrado por Flyway con hash BCrypt desde `ADMIN_PASSWORD_HASH`. JWT 8 h en header `Authorization: Bearer`. Token en `sessionStorage` en el front |
| CORS | Un origen exacto desde `CORS_ALLOWED_ORIGIN`, `allowCredentials(false)` |
| Imágenes | URL externa (Cloudinary o similar) guardada como `imageUrl`. Sin subida de archivos en v1 |
| Paleta | Rojo de marca `#7E0E0E` (logo). Burgundy `#4B1D3F`, Nude `#E8D9C1`, Rose Smoke `#D8A7B1`, Off Black `#1B1B1B`, Vanilla Silk `#EEE2D4`, Alpine Oat `#D8C7B7`, Warm Greige `#B19E90`, Cherry Velvet `#5A1F24`, Bordeaux Noir `#32191D` |
| Tipografía | Cormorant Garamond (display), Manrope (cuerpo), JetBrains Mono (etiquetas). Prohibido Inter, Roboto, Arial, system-ui como principal |
| Hosting previsto | Front en Vercel; back + Postgres en Railway o Render |
| Idioma de la web | Español (Perú) |

## Entregables (verificables)

### Frontend (`frontend/`)
1. **Landing SPA** en `/` con secciones ancladas: Inicio, Sobre AGP Desing, Cómo funciona, FAQ, Contacto (Instagram, TikTok, WhatsApp).
2. **Catálogo** en `/catalogo` que consume `GET /api/products`, con filtro por estado, y **ficha** en `/catalogo/:slug`. Cada cuadro se muestra a su proporción real (ancho/alto en cm).
3. **Botón inteligente**: `buildWhatsAppUrl(product)` → `https://wa.me/<VITE_WHATSAPP_NUMBER>?text=` con el mensaje `Hola, vengo de la web. Me interesa cotizar el cuadro "<nombre>".` codificado.
4. **Panel admin** en `/admin/*` protegido por `ProtectedRoute` (solo UX; la autorización real es del backend): login, lista, crear, editar, eliminar con confirmación.
5. **Modo demo**: sin `VITE_API_URL` la app funciona con datos locales (`src/data/mock-products.ts`) y login `admin` / `demo`.
6. Tipos exactos en `src/types/product.ts` (`Product`, `ProductCreateDTO`, `ProductUpdateDTO`, `ProductStatus`).
7. Diseño que pase el AI Slop Test según `.claude/skills/frontend-design`: asimetría, etiquetas de museo en mono, sin tarjetas uniformes ni sombras genéricas. Motion según `animate` y `emil-design-eng`; `review-animations` sin Blocks.
8. Accesibilidad AA: un `h1` por página, labels visibles, foco visible, 44 px de toque, `prefers-reduced-motion` más suave (no cero).
9. `npm run build` sin errores. Capturas a 375 / 768 / 1440 con `npm run qa:shots`.

### Backend (`backend/`)
10. Capas con estos paquetes exactos bajo `com.agpdesing`: `domain.{model,repository,exception}`, `application.{usecase,port.out}`, `presentation.{rest,dto,mapper,advice,ratelimit}`, `infrastructure.{persistence,security,config}`.
11. `domain.model.Product` con invariantes (nombre 2–120, precio > 0 en centavos, medidas > 0, técnica obligatoria, `imageUrl` http(s) o `/`), slug derivado del nombre.
12. Puerto `domain.repository.ProductRepository` y adaptador `infrastructure.persistence.adapter.ProductRepositoryImpl` sobre `SpringDataProductRepository`. `ProductJpaEntity` es una clase distinta de `Product`.
13. Casos de uso como POJOs: `Create/Update/Delete/Get/ListProducts`, `AuthenticateAdmin`. Cableados en `UseCaseConfig`.
14. REST: `GET /api/products` y `GET /api/products/slug/{slug}` públicos; `GET /api/products/{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` con `ROLE_ADMIN`. `POST /api/auth/login` con rate limit 5/min/IP.
15. `@Valid` en todos los `@RequestBody`; errores en formato RFC 7807 con mapa `errors` por campo; sin stack traces.
16. Spring Security: `STATELESS`, CSRF deshabilitado (justificado: Bearer sin cookie), `JwtAuthenticationFilter` antes de `UsernamePasswordAuthenticationFilter`, `anyRequest().denyAll()` con `/error` permitido, CSP y HSTS.
17. `application.yml` solo con `${VARIABLES}`; `.env.example` documentado; `docker-compose.yml` con Postgres.
18. Flyway `V1__create_products.sql`, `V2__create_admin_user.sql` (usa placeholders `${admin_username}`, `${admin_password_hash}`).
19. Tests sin Spring: `CleanArchitectureTest` (ArchUnit) y `CreateProductUseCaseTest` con repositorio en memoria. `mvn test` en verde.

## Cómo trabajar

- No preguntes por decisiones ya cerradas arriba. Si algo falta de verdad, asume lo razonable, dilo en una línea y sigue.
- Construye el frontend hasta que `npm run build` pase y las capturas se vean bien; luego el backend.
- Al terminar, reporta por separado qué se **verificó** (build, capturas, tests) y qué **no pudo verificarse** (por ejemplo, si no hay JDK/Maven en la máquina).
