# Arquitectura de AGP Desing

Cómo está organizado el código, qué patrones se usan y dónde, y cómo añadir algo nuevo sin
romper lo que hay. Escrito tras la reestructuración de octubre de 2026 (commits `1ca92dc` a
`f690956`). El plan original de fases sigue en [`plan-agp-design.md`](plan-agp-design.md).

Criterio: un patrón entra **solo donde quita una duplicación o abre un punto de extensión real**.
Con este tamaño (unas 4 300 líneas de web y 2 600 de API), una interfaz para cada cosa o una
carpeta por funcionalidad añadirían capas sin ganar nada.

---

## Backend (Java 21 + Spring Boot 3.5)

Clean Architecture con cuatro capas. La regla de dependencias la comprueba `CleanArchitectureTest`
(ArchUnit) en cada `mvnw test`:

```
domain  ←  application  ←  presentation
   ↑            ↑
   └──── infrastructure ────┘        nadie depende de infrastructure
```

| Capa | Qué hay | Qué no puede importar |
|---|---|---|
| `domain/` | `Product`, `Money`, `SiteSettings`, `UrlPublica`; puertos de repositorio; `DomainException` y sus hijas | Spring, JPA, validación, Jackson, JJWT, servlets, bucket4j |
| `application/` | casos de uso (POJOs); puertos de salida (`ImageStorage`, `TokenProvider`, `PasswordHasher`, `Transacciones`); `ApplicationException` y sus hijas; limpieza de fotos | lo mismo |
| `presentation/` | controladores REST, DTOs, mappers, `GlobalExceptionHandler`, frenos de peticiones | `infrastructure` |
| `infrastructure/` | JPA, Spring Security + JWT, Supabase Storage, `UseCaseConfig` (cablea los casos de uso) | — |

### Patrones y dónde están

| Patrón | Dónde | Para qué |
|---|---|---|
| Puertos y adaptadores | `domain/repository/*`, `application/port/out/*` ↔ `infrastructure/**` | Cambiar de base de datos o de almacén de fotos sin tocar el núcleo |
| Unit of Work | `Transacciones` ↔ `SpringTransacciones` | Comprobar que el nombre no está repetido y guardar, en una sola transacción |
| Strategy | `LimpiadorDeFormato` → `LimpiadorJpeg` / `LimpiadorPng` / `LimpiadorWebp`, elegido en `LimpiadorDeMetadatos` | Un formato nuevo es una clase nueva; el `switch` no compila sin ella |
| Value Object | `Money`, `ProductId`, `SiteSettings`, `UrlPublica` | Cada regla de un dato vive en un sitio |
| Mapper | `presentation/mapper/*` (JSON ↔ núcleo), `infrastructure/persistence/mapper/*` (núcleo ↔ JPA) | Los DTO y las entidades se quedan como datos puros |
| Composición | `LimitadorPorClave`, usado por `LoginRateLimiter` y `SubidaRateLimiter` | Un solo código para «N intentos por minuto por clave» |
| Raíz de composición | `UseCaseConfig` | El único sitio que decide qué implementación recibe cada caso de uso |

### Errores

Cada error vive en la capa que lo lanza y hereda de su base (ArchUnit lo comprueba):
`DomainException` (dato inválido, obra que no existe, nombre repetido, credenciales) y
`ApplicationException` (formato no admitido, foto ilegible, almacén caído o sin configurar).
Ninguno sabe de HTTP: la traducción a códigos está entera en `GlobalExceptionHandler`. Las
respuestas siguen RFC 7807 (`ProblemDetail`) con un mapa `errors` campo → mensaje, que es lo que
el panel pinta bajo cada casilla.

### Receta: un recurso nuevo (por ejemplo, «categorías»)

1. **Dominio**: `domain/model/Categoria` con sus reglas y `domain/repository/CategoriaRepository`.
2. **Casos de uso**: `application/usecase/categoria/*`, POJOs que reciben el puerto. Si comprueban
   algo y luego guardan, envolverlo en `Transacciones`.
3. **Tests sin Spring** de los casos de uso, con un repositorio en memoria (ver `ProductUseCasesTest`).
4. **Persistencia**: migración `V<n>__create_categorias.sql` (con RLS activado, ver `CLAUDE.md`),
   entidad JPA, repositorio Spring Data, mapper y adaptador en `infrastructure/persistence/`.
5. **Cableado**: un `@Bean` por caso de uso en `UseCaseConfig`.
6. **API**: DTOs con `@Valid` que toman sus límites de las constantes del dominio, mapper en
   `presentation/mapper/`, controlador en `presentation/rest/` y la regla de acceso en
   `SecurityConfig`.
7. **Contrato**: añadir sus rutas y cuerpos a `ApiContractTest`.

---

## Frontend (React 19 + TypeScript + Vite)

```
src/
├── config/      env.ts (variables VITE_*), enlaces.ts (menú, pie y redes, una sola vez)
├── types/       contratos con el backend: product.ts ↔ ProductResponse.java, settings.ts ↔ SiteSettingsResponse.java
├── services/    contratos.ts · demo/ · remoto/ · servicios.ts · http.ts
├── hooks/       useProducts (con caché), useSettings, useRecurso, usePageTitle, useAuth
├── lib/         format, whatsapp, errores, navegacion, movimiento, sonido
├── security/    AuthContext, ProtectedRoute, tokenStorage
├── components/  ui/ · layout/ · catalog/ · admin/
└── pages/       public/ (y sections/) · admin/
```

### Patrones y dónde están

| Patrón | Dónde | Para qué |
|---|---|---|
| Repository | `services/contratos.ts` (`ProductRepository`, `SettingsRepository`, `AuthGateway`, `ImageUploader`) | El modo demo y la API cumplen el mismo contrato; si a uno le falta un método, TypeScript avisa |
| Abstract Factory | `crearServicios(demo)` en `services/servicios.ts` | Un solo sitio decide demo o API, **una vez al cargar** |
| Hook de recurso | `hooks/useRecurso.ts` | Pedir una cosa y saber si carga, está o no existe; la ficha y la edición lo comparten |
| Contratos de navegación | `lib/navegacion.ts` | Lo que una página le pasa a otra al navegar, con tipo y comprobado al leerlo |
| Fuente única | `config/enlaces.ts`, `lib/movimiento.ts`, `lib/errores.ts` | Enlaces, curvas de animación y manejo de errores escritos una vez |

### Reglas que no se ven en el código

- `crearServicios` se llama **solo** en `servicios.ts`, al cargar el módulo. Llamarla desde un
  componente crearía otro almacén del demo y se perderían las obras dadas de alta en el panel.
- `src/data/mock-products.ts` no se mueve: `scripts/qa/content.mjs` lo reconoce por el nombre.
- Las rutas de `scripts/qa/*` están escritas a mano (`HomePage.tsx`, `index.css`, las páginas que
  recorren). Mover archivos de sitio exige revisar esos scripts.
- Las pruebas (`*.test.ts[x]`, Vitest) corren siempre en modo demo y con contactos de ejemplo,
  digan lo que digan `frontend/.env` y el entorno (`vite.config.ts`, bloque `test`).

### Receta: un recurso nuevo en la web

1. El tipo en `types/`, idéntico al DTO de respuesta del backend.
2. El contrato en `services/contratos.ts` y sus dos implementaciones: `services/demo/` (en memoria)
   y `services/remoto/api.ts` (una línea por endpoint, sin lógica).
3. Una línea en cada rama de `crearServicios` y su export al final de `servicios.ts`.
4. Las páginas lo usan con `useRecurso` (una cosa) o con un hook propio si necesita caché.
5. Tests en Vitest del almacén demo y del hook.

---

## Módulo de ventas (oct. 2026)

El registro interno de las ventas que se cierran por WhatsApp. Es el primer recurso hecho con las
recetas de arriba, de punta a punta.

- **Solo en el panel.** `/api/sales/**` exige sesión para todo, también para leer
  (`SecurityConfig`), y `scripts/seguridad/autorizacion.mjs` comprueba que sin token cada ruta da
  401. Ni una venta, ni un nombre, ni un teléfono se pinta nunca en la web pública.
- **Dominio** (`Sale`): con o sin obra del catálogo (encargo a medida), cliente (nombre y teléfono,
  solo dígitos), total y adelanto en céntimos de sol (el saldo se calcula), medio de pago (Yape,
  transferencia, contraentrega) y estado (pendiente, en producción, entregada, cancelada).
- **Con obra**, la venta copia su nombre al registrarse y lo conserva aunque la obra cambie o se
  borre (`ON DELETE SET NULL`). Si se marca la casilla, la obra pasa a «Vendido» en la misma
  transacción (`SaveSaleUseCase` + `Transacciones`). Al cancelar o borrar esa venta, el panel
  ofrece devolverla a «Disponible»; no lo hace solo.
- **Resumen del mes** (`SalesSummaryUseCase`): vendido, mes anterior, por cobrar, número de ventas y
  lo más vendido (por obra, o por nombre si no la hay). Las canceladas no cuentan. Se calcula en
  memoria: un taller vende decenas al mes.
- **CSV para Excel** (`VentasCsv`): `;`, punto decimal, UTF-8 con BOM y sin `sep=;`, teléfonos
  agrupados y fórmulas neutralizadas (una celda que empieza por `=`, `+`, `-` o `@` lleva `'`
  delante). Comprobado abriéndolo en Excel con Windows en es-PE.
- **Frontend**: `types/sale.ts` (contrato), `SalesRepository` con su demo (`services/demo/ventas.ts`,
  mismas reglas y mismo CSV que el servidor) y su versión remota; pantallas `VentasPage`,
  `VentaEditPage` y `VentaForm`. Importes con `formatSoles` (céntimos incluidos, a diferencia de
  `formatPrice`, que redondea al sol) y fechas con `lib/fechas.ts` (siempre hora de Lima).

## Cómo se comprueba que nada se rompe

| Qué | Comando | Qué mira |
|---|---|---|
| Backend | `.\mvnw.cmd test` | ArchUnit, casos de uso, contrato HTTP completo (`ApiContractTest`), frenos, limpieza de fotos |
| Web | `npm test` | Modo demo, caché del catálogo, sesión, navegación, formatos |
| Web | `npm run build` y `npm run lint` | Tipos y estilo |
| Calidad | `npm run qa` | Accesibilidad, contraste, pantallas, enlaces, textos, código sin usar, Lighthouse |
| Seguridad | `npm run seg` | Secretos, librerías, cabeceras, permisos, Supabase, freno del login |

---

## Encontrado y pendiente

Se vio durante la reestructuración y no se arregló porque cambia comportamiento y no estaba
aprobado:

- **Los botones del panel no reaccionan al pulsarlos.** La regla `.btn:active` nunca se aplicaba
  (`@apply btn` no añade la clase `btn`) y se borró. Arreglarlo cambiaría el panel.
- `docs/portada.png` (la del README) es anterior al rediseño Capas.
- **La política de privacidad no menciona el registro de ventas.** Dice que el nombre y el teléfono
  del cliente solo quedan en WhatsApp y en el teléfono; desde el módulo de ventas también quedan en
  la base de datos (solo para el panel). El dueño decidió no tocarla por ahora (7 oct. 2026); la Ley
  29733 pide que diga qué datos se guardan. Texto propuesto: «Si nos compras, lo apuntamos también
  en nuestro registro de ventas: tu nombre, tu teléfono, lo que pediste, el precio, cuánto
  adelantaste y cómo pagaste. Ese registro está en nuestra base de datos, solo lo ve el taller desde
  su panel y no aparece en la web.»
- Si se salta de golpe hasta el fondo de una página (sin pasar por las fotos, que cargan al
  acercarse), al volver de una ficha la obra puede quedar unas decenas de píxeles corrida: esas
  fotos cargan entonces y cambian el alto de lo que hay encima. El scroll se restaura exacto; lo
  que se mueve es el contenido. Bajando con normalidad no pasa (comprobado en móvil y escritorio).
  Arreglarlo del todo exigiría guardar las medidas en píxeles de cada foto en la base de datos.
- Cuando la base de datos rechaza un nombre repetido, Hibernate escribe una línea `ERROR` en el log
  aunque la respuesta sea un 409 correcto.
