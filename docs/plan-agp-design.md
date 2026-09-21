# Plan: Arquitectura Full-Stack para AGP desing

Fuente: `docs/prompt-maestro-original.md` → reescrito como `docs/PROMPT-MAESTRO.md`. Stack: React 19 + TypeScript + Vite 8 + Tailwind v4 (frontend) · Java 21 + Spring Boot 3.3 + PostgreSQL (backend). Clean Architecture en ambos lados.

Dos correcciones al prompt original:
- **Off Black `#1B1B11B`** tiene 7 dígitos y no es un hex válido. Se asume `#1B1B1B`.
- Los cinco tonos complementarios no traían hex en el prompt; se muestrearon de `docs/brand/paleta.png`. Cherry Velvet se aclaró a `#5A1F24` porque en la foto quedaba a 25 puntos RGB de Bordeaux Noir. El rojo del logotipo (`#7E0E0E`, `docs/brand/logo.png`) es el color primario real de la marca; el Burgundy del brief queda como secundario.

---

## Fases de implementación

| Fase | Qué se hace | Resultado verificable |
|------|-------------|-----------------------|
| 0. Prerrequisitos | Instalar JDK 21, Maven 3.9, Docker Desktop (PostgreSQL local). Node 20 ya está. | `java -version`, `mvn -v`, `docker --version` responden |
| 1. Backend: dominio + casos de uso | Entidades puras, puerto `ProductRepository`, casos de uso CRUD con validaciones. Sin Spring. | Tests unitarios sin contexto de Spring |
| 2. Backend: infraestructura | `ProductJpaEntity`, `SpringDataProductRepository`, `ProductRepositoryImpl`, Flyway V1, `application.yml` con `${VARS}` | `mvn spring-boot:run` levanta contra Postgres en Docker |
| 3. Backend: presentación + seguridad | Controllers REST, DTOs con `@Valid`, `GlobalExceptionHandler`, Spring Security + JWT, CORS restrictivo | `POST /api/products` sin token → 401; con token → 201 |
| 4. Frontend: base | Vite + TS + Tailwind con la paleta, router, `env.ts`, `http.ts`, tipos | `npm run dev` muestra shell vacío con colores correctos |
| 5. Frontend: vista pública | Home (Inicio, Sobre, Cómo funciona, FAQ, Contacto), catálogo consumiendo la API, botón WhatsApp | Click en "Cotizar" abre `wa.me` con mensaje prellenado |
| 6. Frontend: admin | Login, `ProtectedRoute`, CRUD de productos | Sin token `/admin` redirige a `/admin/login` |
| 7. Endurecimiento | Rate limit en `/auth/login`, headers de seguridad, `.env.example` en ambos repos, CI con `mvn verify` + `npm run build` | Checklist de la sección 5 cumplido |

---

## Entregable 1 — Árbol de carpetas del Frontend

```
agp-frontend/
├── .env.example                 # VITE_API_URL, VITE_WHATSAPP_NUMBER (config pública, NO secretos)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx                          # monta el router y AuthProvider
    ├── index.css                        # @tailwind base; components; utilities
    │
    ├── config/
    │   └── env.ts                       # lee import.meta.env, valida en arranque, exporta tipado
    │
    ├── types/                           # contratos TS compartidos
    │   ├── product.ts                   # Product, ProductCreateDTO, ProductUpdateDTO
    │   ├── auth.ts                      # LoginRequest, AuthResponse
    │   └── api.ts                       # ApiError, Page<T>
    │
    ├── services/                        # única capa que habla HTTP
    │   ├── http.ts                      # fetch wrapper: baseURL + header Authorization + manejo 401
    │   ├── productService.ts            # list, getById, create, update, remove
    │   └── authService.ts               # login, logout
    │
    ├── security/                        # todo lo relacionado con sesión y sanitización
    │   ├── tokenStorage.ts              # get/set/clear del JWT (ver sección 5)
    │   ├── AuthContext.tsx              # estado de sesión, isAuthenticated, login(), logout()
    │   ├── ProtectedRoute.tsx           # guard de /admin/* — solo UX; la autorización real es del backend
    │   └── sanitize.ts                  # DOMPurify, solo si se permite HTML en descripciones
    │
    ├── hooks/
    │   ├── useAuth.ts                   # consume AuthContext
    │   ├── useProducts.ts               # loading / error / data para catálogo y admin
    │   └── useWhatsAppLink.ts           # (product) => url wa.me codificada
    │
    ├── lib/
    │   ├── whatsapp.ts                  # buildWhatsAppUrl(phone, product)
    │   └── format.ts                    # moneda, medidas
    │
    ├── components/
    │   ├── ui/                          # Button, Input, Textarea, Badge, Modal, Spinner
    │   ├── layout/                      # Navbar, Footer, Section, Container
    │   ├── catalog/                     # ProductCard, ProductGrid, WhatsAppButton
    │   └── admin/                       # ProductForm, ProductTable, ConfirmDialog
    │
    ├── pages/
    │   ├── public/
    │   │   ├── HomePage.tsx             # SPA con anclas: #inicio #sobre #como-funciona #faq #contacto
    │   │   ├── sections/
    │   │   │   ├── Hero.tsx
    │   │   │   ├── About.tsx
    │   │   │   ├── HowItWorks.tsx
    │   │   │   ├── Faq.tsx
    │   │   │   └── Contact.tsx          # Instagram, TikTok, WhatsApp
    │   │   ├── CatalogPage.tsx          # consume GET /api/products
    │   │   └── ProductDetailPage.tsx
    │   └── admin/
    │       ├── LoginPage.tsx
    │       ├── AdminLayout.tsx
    │       ├── ProductListPage.tsx
    │       ├── ProductCreatePage.tsx
    │       └── ProductEditPage.tsx
    │
    └── router/
        └── routes.tsx                   # públicas + /admin/* envueltas en <ProtectedRoute>
```

### Interfaces TypeScript (`src/types/product.ts`)

```ts
export type ProductStatus = "AVAILABLE" | "SOLD" | "COMMISSION";
export type Currency = "PEN" | "USD";

export interface Product {
  id: string;             // UUID generado por el backend
  name: string;
  slug: string;
  description: string;    // texto plano; React lo escapa al renderizar
  priceCents: number;     // entero — nunca float para dinero
  currency: Currency;
  widthCm: number;
  heightCm: number;
  technique: string;      // "Óleo sobre lienzo", "Acrílico", ...
  imageUrl: string;
  status: ProductStatus;
  featured: boolean;
  createdAt: string;      // ISO 8601
  updatedAt: string;
}

export type ProductCreateDTO = Omit<Product, "id" | "slug" | "createdAt" | "updatedAt">;
export type ProductUpdateDTO = Partial<ProductCreateDTO>;
```

### Botón inteligente (`src/lib/whatsapp.ts`)

```ts
import type { Product } from "@/types/product";

export function buildWhatsAppUrl(phoneE164: string, product: Product): string {
  const text = `Hola, vengo de la web. Me interesa cotizar el "${product.name}".`;
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(text)}`;
}
```

`phoneE164` viene de `VITE_WHATSAPP_NUMBER` (sin `+`, ej. `573001234567`). Es configuración pública, no un secreto: cualquiera lo ve en el enlace.

---

## Entregable 2 — Árbol de carpetas del Backend

```
agp-backend/
├── pom.xml
├── .env.example                       # DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET, CORS_ALLOWED_ORIGIN
├── src/main/resources/
│   ├── application.yml                # solo ${VARIABLES}; sin valores reales
│   └── db/migration/
│       └── V1__create_products.sql    # Flyway
└── src/main/java/com/agpdesign/
    ├── AgpDesignApplication.java
    │
    ├── domain/                                    # CAPA 1 — cero imports de Spring / JPA / Jackson
    │   ├── model/
    │   │   ├── Product.java                       # entidad pura con invariantes (precio > 0, medidas > 0)
    │   │   ├── ProductId.java                     # record sobre UUID
    │   │   ├── ProductStatus.java
    │   │   └── Money.java
    │   ├── repository/
    │   │   └── ProductRepository.java             # PUERTO: interfaz que la infraestructura implementa
    │   └── exception/
    │       ├── ProductNotFoundException.java
    │       └── DomainValidationException.java
    │
    ├── application/                               # CAPA 2 — casos de uso (POJOs, sin @Service)
    │   ├── usecase/product/
    │   │   ├── CreateProductUseCase.java
    │   │   ├── UpdateProductUseCase.java
    │   │   ├── DeleteProductUseCase.java
    │   │   ├── GetProductUseCase.java
    │   │   └── ListProductsUseCase.java
    │   ├── usecase/auth/
    │   │   └── AuthenticateAdminUseCase.java
    │   └── port/out/                              # contratos hacia afuera que no son BD
    │       ├── TokenProvider.java                 # generate(subject) / validate(token)
    │       └── PasswordHasher.java
    │
    ├── presentation/                              # CAPA 3 — REST
    │   ├── rest/
    │   │   ├── ProductController.java             # GET público; POST/PUT/DELETE requieren ROLE_ADMIN
    │   │   └── AuthController.java                # POST /api/auth/login
    │   ├── dto/
    │   │   ├── request/
    │   │   │   ├── CreateProductRequest.java      # @NotBlank @Size @Positive @URL
    │   │   │   ├── UpdateProductRequest.java
    │   │   │   └── LoginRequest.java
    │   │   └── response/
    │   │       ├── ProductResponse.java
    │   │       └── AuthResponse.java
    │   ├── mapper/
    │   │   └── ProductDtoMapper.java
    │   └── advice/
    │       └── GlobalExceptionHandler.java        # @RestControllerAdvice → RFC 7807 ProblemDetail
    │
    └── infrastructure/                            # CAPA 4 — frameworks y drivers
        ├── persistence/                           # ÚNICO paquete con imports de JPA / Spring Data
        │   ├── entity/
        │   │   └── ProductJpaEntity.java          # @Entity @Table("products")
        │   ├── springdata/
        │   │   └── SpringDataProductRepository.java   # extends JpaRepository<ProductJpaEntity, UUID>
        │   ├── mapper/
        │   │   └── ProductPersistenceMapper.java  # dominio <-> entidad JPA
        │   └── adapter/
        │       └── ProductRepositoryImpl.java     # implements domain.repository.ProductRepository
        ├── security/
        │   ├── SecurityConfig.java                # SecurityFilterChain, stateless, rutas
        │   ├── CorsConfig.java
        │   ├── AdminUserDetailsService.java
        │   └── jwt/
        │       ├── JwtProperties.java             # @ConfigurationProperties("app.jwt")
        │       ├── JwtTokenProvider.java          # implements application.port.out.TokenProvider
        │       └── JwtAuthenticationFilter.java   # OncePerRequestFilter
        └── config/
            ├── AppProperties.java                 # cors.allowedOrigin, whatsapp, etc.
            └── UseCaseConfig.java                 # @Bean que instancia cada caso de uso con sus puertos
```

Regla de dependencias (verificable con ArchUnit en `src/test`): `domain` no importa nada; `application` importa solo `domain`; `presentation` importa `application` y `domain`; `infrastructure` importa todo pero nadie importa `infrastructure`.

---

## Entregable 3 — Tokens de Tailwind

**Decisión:** Tailwind **v4** con `@tailwindcss/vite`. En v4 no existe `tailwind.config.js`; los tokens van en un bloque `@theme` dentro de `frontend/src/index.css` y Tailwind genera las utilidades (`bg-brand`, `text-silk`, `font-display`…) a partir de ellos. Si alguien necesita v3, el equivalente es `theme.extend.colors` con los mismos hex.

```css
@import "tailwindcss";

@theme {
  /* Marca */
  --color-brand: #7e0e0e;        /* rojo del logotipo — el único acento fuerte */
  --color-brand-deep: #5a1f24;   /* Cherry Velvet, aclarado desde la foto para que no se confunda con Bordeaux */
  --color-burgundy: #4b1d3f;     /* Burgundy del brief — uso puntual */
  --color-bordeaux: #32191d;     /* Bordeaux Noir — footer, superficies oscuras */

  /* Neutros cálidos (muestreados de docs/brand/paleta.png) */
  --color-silk: #eee2d4;         /* Vanilla Silk — fondo principal */
  --color-nude: #e8d9c1;         /* Nude — bandas alternas */
  --color-oat: #d8c7b7;          /* Alpine Oat — bordes */
  --color-greige: #b19e90;       /* Warm Greige — texto terciario */
  --color-rose: #d8a7b1;         /* Rose Smoke — acento suave */
  --color-ink: #1b1b1b;          /* Off Black — texto (corregido: el brief decía #1B1B11B) */
  --color-ink-soft: #4a423f;     /* texto secundario con contraste AA */

  --font-display: "Cormorant Garamond", "Georgia", serif;
  --font-body: "Manrope", "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Consolas", monospace;

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}
```

El archivo real (`frontend/src/index.css`) añade la escala tipográfica fluida, espaciados de sección, utilidades `label`/`btn` y el bloque de `prefers-reduced-motion`.

Uso de roles: fondo `silk` / `nude`, texto `ink`, botones primarios `brand` con hover `brand-deep`, acentos `rose` sobre oscuro, footer `bordeaux`, contacto sobre `brand`. Contraste `ink` sobre `silk` ≈ 13:1; `silk` sobre `brand` ≈ 9:1 — ambos pasan WCAG AA.

---

## Entregable 4 — `ProductRepositoryImpl` (aislamiento de Spring Data JPA)

**El contrato, en el dominio (sin frameworks):**

```java
package com.agpdesign.domain.repository;

import com.agpdesign.domain.model.Product;
import com.agpdesign.domain.model.ProductId;
import java.util.List;
import java.util.Optional;

public interface ProductRepository {
    Product save(Product product);
    Optional<Product> findById(ProductId id);
    List<Product> findAll();
    void deleteById(ProductId id);
}
```

**El adaptador, en infraestructura:**

```java
package com.agpdesign.infrastructure.persistence.adapter;

import com.agpdesign.domain.model.Product;
import com.agpdesign.domain.model.ProductId;
import com.agpdesign.domain.repository.ProductRepository;
import com.agpdesign.infrastructure.persistence.mapper.ProductPersistenceMapper;
import com.agpdesign.infrastructure.persistence.springdata.SpringDataProductRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Único punto donde el dominio toca la base de datos.
 * Los casos de uso dependen de ProductRepository (interfaz del dominio),
 * nunca de esta clase ni de JpaRepository.
 */
@Component
public class ProductRepositoryImpl implements ProductRepository {

    private final SpringDataProductRepository jpa;
    private final ProductPersistenceMapper mapper;

    public ProductRepositoryImpl(SpringDataProductRepository jpa,
                                 ProductPersistenceMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    public Product save(Product product) {
        var entity = mapper.toEntity(product);
        return mapper.toDomain(jpa.save(entity));
    }

    @Override
    public Optional<Product> findById(ProductId id) {
        return jpa.findById(id.value()).map(mapper::toDomain);
    }

    @Override
    public List<Product> findAll() {
        return jpa.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(ProductId id) {
        jpa.deleteById(id.value());
    }
}
```

```java
package com.agpdesign.infrastructure.persistence.springdata;

import com.agpdesign.infrastructure.persistence.entity.ProductJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SpringDataProductRepository extends JpaRepository<ProductJpaEntity, UUID> {
    // Métodos derivados = consultas parametrizadas generadas por Spring Data. Nunca concatenar SQL.
}
```

Por qué esto aísla la BD: `Product` (dominio) y `ProductJpaEntity` (infra) son clases distintas. Cambiar a MongoDB, JDBC puro o un servicio remoto significa escribir otro `ProductRepositoryImpl` y otro mapper; `domain`, `application` y `presentation` no se tocan.

Inyección de los casos de uso sin ensuciar `application` con anotaciones:

```java
@Configuration
public class UseCaseConfig {
    @Bean
    CreateProductUseCase createProductUseCase(ProductRepository repo) {
        return new CreateProductUseCase(repo);   // recibe la INTERFAZ; Spring inyecta ProductRepositoryImpl
    }
}
```

---

## Entregable 5 — Filtro JWT y CORS en Spring Security

### Decisiones

| Tema | Decisión | Por qué |
|------|----------|---------|
| Sesión | `STATELESS` | El JWT lleva la identidad; no hay `JSESSIONID` |
| CSRF | Deshabilitado | Sin cookie de sesión no hay ataque CSRF que explotar. Si se migra a cookie httpOnly, hay que reactivarlo |
| Algoritmo | HS256 con secreto ≥ 256 bits desde `JWT_SECRET` | Un solo emisor y un solo consumidor; no hace falta RSA |
| Expiración | 8 h, sin refresh token en v1 | Un solo admin; re-login diario es aceptable |
| Almacenamiento en el frontend | `sessionStorage` | Ver tradeoff abajo |
| Login | `POST /api/auth/login` con rate limit (Bucket4j, 5 intentos/min por IP) | Fuerza bruta sobre una sola cuenta |

**Tradeoff del almacenamiento del token.** Hay dos opciones y ninguna es gratis:
- `localStorage` / `sessionStorage`: legible por cualquier script en la página → vulnerable a XSS. Inmune a CSRF.
- Cookie `httpOnly; Secure; SameSite=Strict`: JS no puede leerla → inmune a XSS. Pero el navegador la envía sola → reaparece CSRF y hay que reactivar la protección.

Para v1 se elige **`sessionStorage`**: se borra al cerrar la pestaña, la superficie XSS es mínima porque React escapa todo por defecto y no se usa `dangerouslySetInnerHTML`, y evita implementar doble-submit CSRF. Si más adelante se permite HTML en descripciones, migrar a cookie httpOnly.

### `JwtAuthenticationFilter`

```java
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            tokenProvider.validate(token).ifPresent(subject -> {
                var auth = new UsernamePasswordAuthenticationToken(
                        subject, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(req, res);   // si no hay token válido, sigue anónimo; SecurityConfig decide el 401
    }
}
```

`validate()` verifica firma, expiración e `issuer`. Un token inválido no lanza excepción aquí; simplemente no autentica y la cadena devuelve 401 en rutas protegidas.

### `SecurityConfig`

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter,
                                    CorsConfigurationSource cors) throws Exception {
        return http
            .cors(c -> c.configurationSource(cors))
            .csrf(AbstractHttpConfigurer::disable)                       // stateless + Bearer → sin CSRF
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/products/**").permitAll()   // catálogo público
                .requestMatchers("/api/products/**").hasRole("ADMIN")               // POST/PUT/DELETE
                .anyRequest().denyAll())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(h -> h
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000)))
            .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

### `CorsConfig`

```java
@Configuration
public class CorsConfig {

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origin}") String origin) {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(origin));                 // UN origen exacto, nunca "*"
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cfg.setAllowCredentials(false);                         // Bearer en header; no hacen falta cookies
        cfg.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        return source;
    }
}
```

Regla que suele romper todo: `allowCredentials(true)` es incompatible con `allowedOrigins("*")`. Como el token va en el header y no en cookie, `allowCredentials(false)` con un origen explícito es la configuración correcta y más restrictiva. Puerto de dev (`http://localhost:5173`) y dominio de producción se separan por perfil (`application-dev.yml` / `application-prod.yml`), leyendo `CORS_ALLOWED_ORIGIN`.

### `application.yml` (sin valores reales)

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate.ddl-auto: validate      # el esquema lo maneja Flyway, no Hibernate
    open-in-view: false
app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-hours: 8
  cors:
    allowed-origin: ${CORS_ALLOWED_ORIGIN}
```

### Checklist de prevención de vulnerabilidades

- **SQL Injection** — solo métodos derivados de Spring Data o `@Query` con parámetros nombrados. Prohibido `EntityManager.createNativeQuery` con concatenación.
- **Validación de entrada** — `@Valid` en cada `@RequestBody`; `CreateProductRequest` con `@NotBlank`, `@Size(max=2000)` en descripción, `@Positive` en precio y medidas, `@URL` en imagen. `GlobalExceptionHandler` convierte `MethodArgumentNotValidException` en 400 con detalle por campo, sin exponer stack traces.
- **XSS en el frontend** — renderizar `product.description` como `{product.description}`; React lo escapa. `dangerouslySetInnerHTML` queda prohibido salvo que pase por `sanitize.ts` (DOMPurify).
- **Guard de `/admin`** — `ProtectedRoute` mejora la UX; la autorización que cuenta es `hasRole("ADMIN")` en el backend. Un usuario que edite el bundle y salte el guard solo verá 401.
- **Secretos** — `JWT_SECRET`, `DB_PASSWORD`, `DB_URL` nunca en git. `.env.example` documenta las variables con valores vacíos. `VITE_*` no es un secreto: todo lo que empieza con `VITE_` termina en el bundle público.
- **Contraseña del admin** — hash BCrypt sembrado por Flyway (`V2__seed_admin.sql`) desde una variable `ADMIN_PASSWORD_HASH`, nunca la contraseña en claro.
