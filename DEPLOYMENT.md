# 🚀 Guía de Despliegue en la Nube (100% Plan Gratuito) — Vivelite ERP

Esta guía detalla los pasos exactos para desplegar el sistema en producción utilizando únicamente plataformas en su nivel gratuito (**Free Tier**), sin costos mensuales y con alta disponibilidad.

```
                         INTERNET (Usuarios)
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
                 ▼                                 ▼
           VERCEL (Free)                     RENDER (Free)
        Next.js 15 Frontend                NestJS 10 Backend
                 │                                 │
                 │                          ┌──────┴──────┐
                 │                          │             │
                 │                          ▼             ▼
                 │                    SUPABASE (Free)  UPSTASH (Free)
                 │                      PostgreSQL       Redis / TLS
                 │                                         │
                 │                                         ▼
                 │                                      BullMQ
                 └────────────── HTTPS ────────────────────┘
```

---

## 🗄️ PASO 1: Base de Datos — Supabase PostgreSQL (Plan Gratuito)

1. Ingresa a [https://supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Crea un nuevo proyecto:
   - **Name**: `vivelite-erp-db`
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: Selecciona `East US (North Virginia)` o `Sao Paulo` (para menor latencia en Perú).
3. Obtén las cadenas de conexión en **Project Settings -> Database**:
   - **Connection String (URI / Mode Direct - Puerto 5432)**:
     ```text
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```
   - **Connection String (Transaction Mode / Pooler - Puerto 6543)**:
     ```text
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
     ```
4. **Ejecutar migraciones iniciales a Supabase**:
   Desde tu terminal local con la URL directa de Supabase:
   ```bash
   cd backend
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require" pnpm prisma:deploy
   ```
   *(Opcional) Cargar datos maestros iniciales de Ica:*
   ```bash
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require" pnpm prisma:seed
   ```

---

## ⚡ PASO 2: Redis Serverless — Upstash (Plan Gratuito)

1. Ingresa a [https://upstash.com](https://upstash.com) y crea una cuenta gratuita.
2. En la consola de Upstash, haz clic en **Create Database**:
   - **Name**: `vivelite-redis`
   - **Type**: Regional
   - **Region**: La misma región que tu base de datos (ej. `us-east-1`).
   - **TLS (SSL)**: Habilitado (**Enabled**).
3. En la sección **Details / Connect**:
   - Copia la URL de conexión que comienza con `rediss://`:
     ```text
     rediss://default:[TOKEN]@[ENDPOINT].upstash.io:6379
     ```

---

## ⚙️ PASO 3: Backend API — Render (Plan Gratuito)

El backend de NestJS está preparado para desplegarse mediante el Blueprint de Render [`render.yaml`](render.yaml) o como un **Web Service**:

1. Ingresa a [https://render.com](https://render.com) y conecta tu cuenta de GitHub.
2. Haz clic en **New + -> Blueprint** (o **New Web Service**):
   - Selecciona tu repositorio: `BrunoRasot/Sistema-ERP`.
   - Render detectará automáticamente el archivo `render.yaml`.
3. Si lo configuras manualmente como **Web Service**:
   - **Name**: `vivelite-erp-api`
   - **Region**: `Oregon (US West)` o `Ohio (US East)`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm build
     ```
   - **Start Command**:
     ```bash
     pnpm start:prod
     ```
   - **Plan**: `Free`
4. **Variables de Entorno en Render** (En la pestaña **Environment**):
   | Variable | Valor |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `API_PREFIX` | `api/v1` |
   | `DATABASE_URL` | Tu URI de Supabase (con `sslmode=require`) |
   | `REDIS_URL` | Tu URL de Upstash (`rediss://...`) |
   | `CORS_ORIGIN` | Tu URL de Vercel (ej: `https://vivelite-erp.vercel.app`) |
   | `JWT_ACCESS_SECRET` | Clave aleatoria de 32 caracteres (`openssl rand -base64 32`) |
   | `JWT_REFRESH_SECRET` | Clave aleatoria de 32 caracteres (`openssl rand -base64 32`) |
   | `JWT_ACCESS_EXPIRATION`| `15m` |
   | `JWT_REFRESH_EXPIRATION`| `7d` |

5. **Health Check en Render**:
   - Health Check Path: `/api/v1/health`
6. Haz clic en **Create Web Service**. Render compilará y publicará tu API con una URL como:
   `https://vivelite-erp-api.onrender.com`

---

## 🌐 PASO 4: Frontend — Vercel (Plan Gratuito)

1. Ingresa a [https://vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **Add New... -> Project**:
   - Importa el repositorio: `BrunoRasot/Sistema-ERP`.
3. **Configuración del Proyecto**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Haz clic en **Edit** y selecciona `frontend`.
4. **Variables de Entorno en Vercel**:
   | Variable | Valor |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://vivelite-erp-api.onrender.com/api/v1` (La URL pública de Render) |
5. Haz clic en **Deploy**. Vercel compilará tu aplicación en ~1 minuto y generará tu dominio gratuito:
   `https://vivelite-erp.vercel.app`

---

## 🔒 Consideraciones del Plan Gratuito

1. **Inactividad de Render Free**:
   - El plan gratuito de Render suspende el contenedor web tras 15 minutos sin peticiones entrantes.
   - Cuando llega una nueva petición, Render tarda entre 30 y 50 segundos en reactivar el contenedor (*cold start*).
   - El frontend cuenta con spinners y reintentos automáticos de TanStack Query para mitigar esta espera.
2. **Workers BullMQ Integrados**:
   - En lugar de requerir un Background Worker de pago adicional, las colas y workers de BullMQ se ejecutan dentro del mismo proceso del Web Service de NestJS, consumiendo 0 costos adicionales.
3. **Conexiones PostgreSQL**:
   - Supabase Free incluye 500 MB de almacenamiento y conexiones seguras con SSL activo.
4. **Upstash Free**:
   - Upstash incluye 10,000 comandos diarios gratuitos, más que suficiente para operaciones ERP de colas y reintentos.
