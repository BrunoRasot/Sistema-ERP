# GUÍA DE DESPLIEGUE Y CONFIGURACIÓN — DEMO VIVELITE ERP PARA PORTAFOLIO

Esta guía explica cómo desplegar y configurar la versión **DEMO** de **Vivelite ERP** para enlazarla desde tu portafolio profesional, manteniendo un **aislamiento total e infranqueable con el entorno de producción**.

---

## 1. Arquitectura del Despliegue Demo

```
PORTAFOLIO PROFESIONAL
        ↓ (Clic en "Ver Demo")
FRONTEND DEMO (Vercel)
        ↓ (Peticiones HTTPS con JWT)
BACKEND DEMO (Render / Railway)
        ↓ (Conexión SSL)
POSTGRESQL DEMO (Neon / Supabase Free Tier)
```

---

## 2. Paso 1: Base de Datos DEMO (Gratuita en Neon o Supabase)

1. Crea un proyecto gratuito en [Neon.tech](https://neon.tech) o [Supabase.com](https://supabase.com) llamado `vivelite-demo-db`.
2. Copia la URL de conexión PostgreSQL (ej: `postgresql://demo_user:password@ep-cool-demo.us-east-2.aws.neon.tech/vivelite_demo_db?sslmode=require`).
3. Ejecuta las migraciones y el seeder demo:
   ```bash
   cd backend
   # Configura temporalmente DATABASE_URL en tu .env o terminal:
   npx prisma migrate deploy
   npm run seed:demo
   ```

---

## 3. Paso 2: Despliegue del Backend DEMO (Render / Railway)

1. En [Render.com](https://render.com) o [Railway.app](https://railway.app), crea un nuevo **Web Service** apuntando al repositorio (subcarpeta `backend`).
2. Configura las siguientes variables de entorno:

| Variable | Valor Recomendado |
| :--- | :--- |
| `DATABASE_URL` | URL de conexión de la base de datos DEMO |
| `DIRECT_URL` | URL directa de la base de datos DEMO |
| `APP_ENV` | `demo` |
| `DEMO_MODE` | `true` |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `API_PREFIX` | `api/v1` |
| `CORS_ORIGIN` | URL de tu frontend en Vercel (ej: `https://vivelite-demo.vercel.app`) |
| `JWT_ACCESS_SECRET` | Generar clave aleatoria de 32+ caracteres |
| `JWT_REFRESH_SECRET` | Generar clave aleatoria de 32+ caracteres |
| `JWT_ACCESS_EXPIRATION` | `15m` |
| `JWT_REFRESH_EXPIRATION` | `7d` |

3. **Comando de Inicio (Start Command):** `node dist/main`
4. **Comando de Compilación (Build Command):** `npm run build`

---

## 4. Paso 3: Despliegue del Frontend DEMO (Vercel)

1. En [Vercel](https://vercel.com), importa el repositorio seleccionando la carpeta raíz `frontend`.
2. Configura las variables de entorno en Vercel:

| Variable | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://tu-backend-demo.onrender.com/api/v1` |
| `NEXT_PUBLIC_DEMO_MODE` | `true` |
| `NEXT_PUBLIC_APP_ENV` | `demo` |

3. Despliega el proyecto.

---

## 5. Credenciales Demo Preconfiguradas para Reclutadores

La pantalla de login incluye botones de **Acceso Rápido con 1-Clic**:

| Perfil Demo | Correo Electrónico | Contraseña | Alcance / Permisos |
| :--- | :--- | :--- | :--- |
| **👑 Administrador** | `admin@demo.local` | `Demo123!` | Acceso completo a todos los módulos y analítica. |
| **💼 Vendedor** | `vendedor@demo.local` | `Demo123!` | Módulo de ventas POS, emisión de comprobantes y catálogo. |
| **🚚 Repartidor** | `repartidor@demo.local` | `Demo123!` | Hoja de ruta, pedidos y entregas a domicilio. |
| **💰 Cajero** | `cajero@demo.local` | `Demo123!` | Arqueos de caja, cobro de cuentas por cobrar. |

---

## 6. Comandos de Mantenimiento y Reseteo Local

Para ejecutar y probar la demo en tu máquina local:

```bash
# 1. Ejecutar Backend Demo
cd backend
npm run start:dev

# 2. Ejecutar Frontend Demo
cd frontend
npm run dev

# 3. Restablecer datos Demo en cualquier momento:
npm run seed:demo
# O reseteo total con limpieza:
npm run demo:reset
```
