# Despliegue de AGP Desing

Estado actual: **todo corre en local** salvo la base de datos, que ya está en Supabase.
Esta guía es para el día que se decida publicar. Todo lo que hace falta ya está en el repo.

| Pieza | Dónde | Costo | Estado |
|---|---|---|---|
| Base de datos | Supabase (Postgres, São Paulo) | Gratis | ✅ en uso |
| Backend Spring Boot | Render (web service Docker) | Gratis (duerme a los 15 min) | preparado: `backend/Dockerfile` |
| Frontend Vite | Vercel (estático) | Gratis | preparado: `frontend/vercel.json` |
| Keep-alive | GitHub Actions | Gratis | `.github/workflows/keep-alive.yml` |

## 0. Supabase (ya hecho)

- Proyecto `psicvwqlgsmfyvqrqnbr`, región `sa-east-1`. Conexión por **Session pooler** (puerto 5432,
  usuario `postgres.<ref>`, `?sslmode=require`). No usar el Transaction pooler (6543): rompe los
  prepared statements de JDBC. La conexión directa es solo IPv6 y Render sale por IPv4.
- Las tablas las crea Flyway. `V3__enable_rls.sql` activa RLS para que la API REST de Supabase
  (clave anon) no vea nada. Además, en el dashboard: **Project Settings → API → Exposed schemas**,
  quitar `public`.
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

   Ojo: `ADMIN_PASSWORD_HASH` solo se usa la **primera** vez que Flyway siembra `admin_users`. Como
   la tabla ya existe en Supabase (sembrada desde local), para cambiar la clave hay que actualizar
   la fila a mano: en Supabase → SQL Editor:
   `update admin_users set password_hash = '<hash>' where username = 'admin';`
5. **Create Web Service**. La primera build tarda ~5 min. Probar: `curl https://<app>.onrender.com/api/products`.
6. Activar el ping cada 10 min: `gh variable set BACKEND_URL --body https://<app>.onrender.com`.
   Alternativa sin sueño: Railway Hobby (~US$5/mes), mismo Dockerfile.

## 2. Frontend en Vercel

1. https://vercel.com → entrar con GitHub → **Add New → Project** → repo `agp-desing`.
2. Root Directory `frontend` · Framework **Vite** (lo detecta) · Build `npm run build` · Output `dist`.
3. Environment variable: `VITE_API_URL` = `https://<app>.onrender.com` (sin barra final).
   WhatsApp, Instagram y TikTok ya van por defecto en `src/config/env.ts`.
4. **Deploy** → anotar la URL (`https://agp-desing-xxxx.vercel.app`).
5. Volver a Render → `CORS_ALLOWED_ORIGIN` = esa URL exacta (sin barra final) → **Manual Deploy**.
   Con dominio propio: apuntarlo en Vercel y poner ese dominio en `CORS_ALLOWED_ORIGIN`.

## 3. Comprobar

```bash
curl https://<app>.onrender.com/api/products                                   # 200 []
curl -X OPTIONS https://<app>.onrender.com/api/products \
  -H "Origin: https://<front>.vercel.app" -H "Access-Control-Request-Method: GET" -D - -o /dev/null
# → Access-Control-Allow-Origin: https://<front>.vercel.app
```
Abrir la web, entrar en `/admin/login` con la clave de producción, crear un cuadro, verlo en el catálogo.

## Después

- Cada `git push` a `main` redespliega Render y Vercel automáticamente.
- Rotar la clave del admin: generar hash nuevo y hacer el `update admin_users …` en Supabase.
- Rotar `JWT_SECRET`: cambiarlo en Render; invalida las sesiones abiertas, nada más.
- Los crons de GitHub Actions se desactivan tras 60 días sin commits en repos públicos:
  reactivar desde la pestaña **Actions** o hacer cualquier commit.
