# Despliegue de AGP Desing

Estado actual: **publicado** (oct. 2026) en `https://agp-desing.vercel.app`. Los pasos de abajo
son los que se siguieron y sirven para rehacerlo o para mover una pieza de sitio.

| Pieza | Dónde | Costo | Estado |
|---|---|---|---|
| Base de datos y fotos | Supabase (Postgres + Storage, São Paulo) | Gratis | ✅ en uso |
| Backend Spring Boot | Render (web service Docker) | Gratis (duerme a los 15 min) | ✅ en uso |
| Frontend Vite | Vercel (estático + dos funciones en `frontend/api/`) | Gratis | ✅ en uso |
| Render despierto | Pinger externo cada 5 min (cron-job.org) | Gratis | ✅ en uso |
| Supabase despierto | GitHub Actions, `.github/workflows/keep-alive.yml` | Gratis | ping diario |
| Google | Search Console, propiedad `https://agp-desing.vercel.app/` | Gratis | ✅ verificada, sitemap enviado |

Cómo llegan los cambios: se preparan en la rama `produccion`, se abre un pull request a `main` y
**fusionarlo es publicar**. Vercel y Render redespliegan solos al recibir el commit en `main`.

## 0. Supabase (ya hecho)

- Proyecto `psicvwqlgsmfyvqrqnbr`, región `sa-east-1`. Conexión por **Session pooler** (puerto 5432,
  usuario `postgres.<ref>`, `?sslmode=require`). No usar el Transaction pooler (6543): rompe los
  prepared statements de JDBC. La conexión directa es solo IPv6 y Render sale por IPv4.
- Las tablas las crea Flyway. `V3__enable_rls.sql` activa RLS para que la API REST de Supabase
  (clave anon) no vea nada. Además, en el dashboard: **Project Settings → API → Exposed schemas**
  (en el panel nuevo está bajo **Data API**), quitar `public`.
- El plan gratis pausa el proyecto tras 7 días sin actividad; el workflow `keep-alive` le hace
  un ping diario. Si aun así se pausa: dashboard → **Restore project**.

## 1. Backend en Render

1. https://render.com → entrar con GitHub → **New → Web Service** → repo `MurginhaSebastian/agp-desing`.
2. Root Directory `backend` · Runtime **Docker** · Region **Oregon** · Instance **Free**.
3. **Health Check Path**: `/api/products`.
4. Environment variables (Render inyecta `PORT` solo):

   | Variable | Valor |
   |---|---|
   | `DB_URL` | `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `DB_USER` | `postgres.psicvwqlgsmfyvqrqnbr` |
   | `DB_PASSWORD` | contraseña de la BD en Supabase |
   | `DB_POOL_SIZE` | `5` |
   | `JWT_SECRET` | **nuevo** para producción: `openssl rand -base64 48` |
   | `JWT_EXPIRATION_HOURS` | `8` |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD_HASH` | hash bcrypt de una clave **nueva** de producción: `docker run --rm httpd:alpine htpasswd -bnBC 12 "" 'clave' \| tr -d ':\n'` |
   | `CORS_ALLOWED_ORIGIN` | de momento `https://agp-desing.vercel.app`; se corrige en el paso 2 con la URL real |
   | `TRUSTED_PROXY_HOPS` | número de proxies propios delante de la app. En Render es `1`, confirmado (ver aviso abajo) |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` — el mismo identificador que ya aparece en `DB_USER` |
   | `SUPABASE_SERVICE_KEY` | la clave **secreta** de Supabase (Settings → API). Da acceso total a la base de datos: solo aquí y en `backend/.env`, nunca en Vercel ni en el código |
   | `SUPABASE_BUCKET` | `productos` |
   | `MAX_IMAGEN_MB` | `5` — el mismo número que `VITE_MAX_IMAGEN_MB` en Vercel |

   **Aviso sobre `TRUSTED_PROXY_HOPS`.** El freno del login (5 intentos por minuto) cuenta por IP.
   En local no hay proxy y el valor `0` es correcto: se usa la IP de la conexión y se ignora la
   cabecera `X-Forwarded-For`, que la escribe quien llama y por tanto se puede falsear.

   En Render sí hay un proxy delante, así que con `0` **todos los visitantes parecen venir de la
   misma IP** (la del proxy) y cinco intentos fallidos de cualquiera dejarían al dueño sin poder
   entrar a su propio panel durante un minuto.

   El valor correcto es el número de proxies propios. En Render es `1`, **confirmado**: al falsear
   `X-Forwarded-For` en una ráfaga contra el login de producción, los intentos siguieron contando
   como 429 (no se saltó el freno). Con el número bien puesto, `ClientIpResolver` toma la IP que
   escribió el proxy contando desde la derecha, que es la única que no puede falsear el visitante.

   Comprobación después: `npm run seg:login` contra la URL de producción
   (`QA_API=https://<app>.onrender.com`) debe dar el 429 a partir del sexto intento.

   Ojo: `ADMIN_PASSWORD_HASH` solo se usa la **primera** vez que Flyway siembra `admin_users`. Como
   la tabla ya existe en Supabase (sembrada desde local), para cambiar la clave hay que actualizar
   la fila a mano: en Supabase → SQL Editor:
   `update admin_users set password_hash = '<hash>' where username = 'admin';`
5. **Create Web Service**. La primera build tarda ~5 min. Probar: `curl https://<app>.onrender.com/api/products`.
6. Mantenerlo despierto (si no, duerme a los 15 min y la primera visita espera ~40 s). Lo hace un
   **pinger externo cada 5 min** (cron-job.org) a `/api/products`, que además toca Supabase. Ojo:
   cron-job.org no dispara hasta que verificas el correo de la cuenta; la prueba es su Historial de
   ejecuciones con códigos 200. El workflow `keep-alive` del repo **también** pinga Render cada
   10 min porque `BACKEND_URL` ya está puesta (`gh variable set BACKEND_URL --body https://<app>.onrender.com`),
   pero GitHub retrasa esos crons y los apaga tras 60 días sin commits, así que no basta por sí
   solo. El plan gratis de Render da 750 horas-instancia al mes: justo para **un** servicio siempre
   encendido (un segundo se pasaría del cupo). Alternativa sin sueño: Railway Hobby (~US$5/mes),
   mismo Dockerfile.

## 1 bis. El almacén de fotos (Supabase Storage)

Las fotos que se suben desde el panel van a Supabase Storage, no al disco de Render (que se
borra en cada despliegue). Una vez, a mano:

1. Supabase → **Storage → New bucket**: nombre `productos`, marcado **Public**.
2. En los ajustes del bucket: tamaño máximo **5 MB** y tipos permitidos `image/jpeg`,
   `image/png`, `image/webp`. Es la segunda red, además de la del backend.
3. Storage → **Policies**: comprobar que `anon` **no** tiene permiso de escritura. El backend
   sube con la clave secreta, que se salta las políticas; nadie más debe poder escribir.
4. Settings → **API** → copiar la clave secreta (`service_role` o `sb_secret_…`; en el panel nuevo,
   pestaña **Legacy anon, service_role API keys**) en `SUPABASE_SERVICE_KEY`, tanto en
   `backend/.env` (local) como en Render.

Comprobación: subir una foto desde `/admin/cuadros/nuevo` y abrir la dirección que queda
guardada. Debe responder la imagen, sin pedir permisos. Con una foto JPG o PNG, al lado debe
existir también su copia ligera: la misma dirección acabada en `.min.jpg` en vez de `.jpg`/`.png`.

## 2. Frontend en Vercel

1. https://vercel.com → entrar con GitHub → **Add New → Project** → repo `agp-desing`.
2. Root Directory `frontend` · Framework **Vite** (lo detecta) · Build `npm run build` · Output `dist`.
3. Environment variable: `VITE_API_URL` = `https://<app>.onrender.com` (sin barra final). La
   leen también las funciones `api/sitemap.ts` y `api/obra.ts` al responder; sin ella el sitemap
   sale solo con las páginas fijas y la vista previa de las obras, con el logo.
   Y `VITE_MAX_IMAGEN_MB` = `5`, el mismo número que `MAX_IMAGEN_MB` en Render: con dos números
   distintos, uno de los dos avisos mentiría.
   Los contactos (`VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_EMAIL`, `VITE_INSTAGRAM_URL`,
   `VITE_TIKTOK_URL`) también van aquí, como tipo **Config** (no Secreto): son públicos y se hornean
   en el bundle al construir, así que cambiarlos exige un redespliegue. Sin ellos la web sale con
   los contactos de ejemplo (el aviso del banner).
4. **Deploy** → anotar la URL (`https://agp-desing-xxxx.vercel.app`).
5. Volver a Render → `CORS_ALLOWED_ORIGIN` = esa URL exacta (sin barra final) → **Manual Deploy**.
   Con dominio propio: apuntarlo en Vercel y poner ese dominio en `CORS_ALLOWED_ORIGIN`.

## 3. Comprobar

```bash
curl https://<app>.onrender.com/api/products                                   # 200 con las obras
curl -X OPTIONS https://<app>.onrender.com/api/products \
  -H "Origin: https://<front>.vercel.app" -H "Access-Control-Request-Method: GET" -D - -o /dev/null
# → Access-Control-Allow-Origin: https://<front>.vercel.app
```
Abrir la web, entrar en `/admin/login` con la clave de producción, crear un cuadro, verlo en el catálogo.

## 4. Google y la vista previa al compartir

- **Search Console**: propiedad de tipo «Prefijo de la URL», verificada con
  `frontend/public/google*.html` (no borrarlo: si desaparece, Google retira la verificación).
  Sitemap enviado: `sitemap.xml`. Indexación y errores, en **Páginas** y **Sitemaps**.
- **Comprobar el sitemap**: `curl https://agp-desing.vercel.app/sitemap.xml` debe dar XML con las
  páginas fijas y una línea por obra.
- **Comprobar la vista previa de una obra** como la ve WhatsApp:
  `curl -A "WhatsApp/2.23" https://agp-desing.vercel.app/catalogo/<slug> | grep og:image`.
  WhatsApp guarda las vistas previas un tiempo: para probar un cambio, compartir el enlace con
  `?v=1` al final.

## Si llega un dominio propio

1. Apuntarlo en Vercel (Settings → Domains).
2. Render → `CORS_ALLOWED_ORIGIN` = el dominio nuevo, exacto y sin barra final → **Manual Deploy**.
3. Cambiar `agp-desing.vercel.app` por el dominio en `frontend/public/robots.txt` (línea
   `Sitemap:`) y en las etiquetas `og:url` y `og:image` de `frontend/index.html`. El sitemap, las
   direcciones canónicas y la vista previa de cada obra toman el dominio de la propia petición.
4. Search Console: añadir el dominio nuevo como propiedad, verificarlo y enviar otra vez el sitemap.

## Después

- Cada commit que llega a `main` (al fusionar un pull request) redespliega Render y Vercel.
- Rotar la clave del admin: generar hash nuevo y hacer el `update admin_users …` en Supabase.
- Rotar `JWT_SECRET`: cambiarlo en Render; invalida las sesiones abiertas, nada más.
- Los crons de GitHub Actions se desactivan tras 60 días sin commits en repos públicos:
  reactivar desde la pestaña **Actions** o hacer cualquier commit.
