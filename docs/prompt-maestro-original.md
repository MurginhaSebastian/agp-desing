# Prompt Maestro: Arquitectura Full-Stack para AGP desing

**Actúa como un Arquitecto de Software, Desarrollador Full-Stack Senior y Experto en Ciberseguridad.**

Necesito que diseñes la estructura de carpetas, la arquitectura técnica y la configuración de seguridad para un proyecto web llamado 'AGP desing', el cual requiere un Frontend en React con TypeScript + Tailwind CSS y un Backend en Java (Spring Boot) con una capa de base de datos relacional estrictamente aislada.

Aplica los principios de *Clean Architecture* en ambos entornos y asegúrate de incluir las mejores prácticas de seguridad defensiva.

## 1. Requerimientos del Frontend (React con TypeScript + Tailwind CSS):
*   **Vista Pública (Landing Page):** Single Page Application (SPA) que incluya Inicio, Sobre AGP desing, Cómo funciona, FAQ y Contacto (con enlaces a Instagram y TikTok).
*   **Catálogo y Botón Inteligente:** Interfaz que consuma la API para mostrar cuadros. El botón de compra no usa carrito, sino que genera un enlace dinámico de WhatsApp redirigiendo al número del negocio con un mensaje pre-llenado (Ej: 'Hola, vengo de la web. Me interesa cotizar el [Producto]'). Define las *Interfaces* (tipos) exactas en TypeScript para los productos.
*   **Panel Administrador (Vista Privada):** Ruta protegida (`/admin`) para un CRUD completo de productos.
*   **Diseño y Estilos:** Configura el `tailwind.config.js` integrando esta paleta exacta: Burgundy (#4B1D3F), Nude (#E8D9C1), Rose Smoke (#D8A7B1), Off Black (#1B1B11B), además de tonos complementarios (Vanilla Silk, Alpine Oat, Warm Greige, Cherry Velvet, Bordeaux Noir).

## 2. Requerimientos del Backend (Java Spring Boot - Clean Architecture):
*   **Capa de Dominio:** Entidades puras y contratos (Interfaces) de repositorios. Cero dependencias de frameworks o bases de datos.
*   **Capa de Casos de Uso:** Lógica de negocio pura (ej. validaciones de creación de productos).
*   **Capa de Presentación:** Controladores REST (`@RestController`).
*   **Capa de Infraestructura (Base de Datos Aislada):** Aquí debe residir exclusivamente la conexión a la base de datos (ej. PostgreSQL) mediante Spring Data JPA, implementando el patrón Repositorio y el Adaptador que cumpla el contrato del Dominio. Esto garantizará que migrar de base de datos en el futuro no afecte la lógica de negocio.

## 3. Requerimientos de Ciberseguridad y Buenas Prácticas:
*   **Autenticación y Autorización:** Implementa Spring Security con JWT (JSON Web Tokens) para proteger los *endpoints* del CRUD, asegurando que solo el administrador autenticado pueda modificar el catálogo. En el frontend, protege las rutas del panel admin evaluando el token guardado de forma segura.
*   **Protección de Datos en Tránsito:** Exige configuración de CORS restrictiva en el backend, permitiendo peticiones únicamente desde el dominio oficial del frontend.
*   **Prevención de Vulnerabilidades:**
    *   **Backend:** Uso estricto de consultas parametrizadas (gestionadas por JPA/Hibernate) para evitar Inyección SQL. Validación de datos de entrada (`@Valid`, `@NotNull`, sanitización) en los DTOs.
    *   **Frontend:** Prevención de ataques XSS al renderizar descripciones dinámicas de productos.
*   **Gestión de Secretos:** Las credenciales de la base de datos, el secreto de JWT y las URLs deben manejarse obligatoriamente a través de variables de entorno (`.env` / `application.properties`), nunca incrustadas ("hardcodeadas") en el código fuente.

## Entregables esperados de tu respuesta:
1.  El árbol de carpetas exacto para el Frontend en React + TypeScript, diferenciando vistas públicas, vistas protegidas, hooks, servicios API, tipos/interfaces y configuraciones de seguridad.
2.  El árbol de carpetas exacto para el Backend en Java, mostrando claramente la separación en las 4 capas de Clean Architecture.
3.  El código del `tailwind.config.js` con los colores personalizados.
4.  Un fragmento de código en Java (Capa de Infraestructura) demostrando cómo la clase `RepositoryImpl` aísla la lógica de Spring Data JPA del resto de la aplicación.
5.  Una breve explicación de cómo configurar el filtro JWT y CORS en la capa de seguridad de Spring Boot.