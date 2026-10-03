# Vivelite — Sistema de Gestión Integral para Distribuidora de Agua

Plataforma empresarial de alta disponibilidad, diseñada con una arquitectura **Modular Monolith** y enfoque **Mobile-First**, especializada en las reglas de negocio de distribución de agua de mesa, control de envases retornables, facturación electrónica SUNAT (Perú), pedidos y repartos en ruta.

---

## Arquitectura del Sistema

- **Backend**: NestJS 10, TypeScript, Prisma ORM 6, PostgreSQL 16, Redis 7, BullMQ, Passport JWT, Swagger OpenAPI.
- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS, TanStack Query v5, Lucide Icons, Mobile-First PWA-ready.
- **Base de Datos**: PostgreSQL 16 con auditoría (`AuditLog`), control de bidones en custodia de clientes (`BottleTransaction`), Kardex de inventario (`InventoryMovement`) y turnos de caja (`CashShift`).

---

## Inicio Rápido en Desarrollo Local

### 1. Prerrequisitos

- Node.js >= 20 (Probado en Node.js v24.14)
- Docker Desktop activo
- pnpm o npm

### 2. Infraestructura (PostgreSQL + Redis)

En la raíz del proyecto:

```bash
docker compose up -d
```

> PostgreSQL queda expuesto en el puerto `5433` (para evitar conflictos con instalaciones locales) y Redis en el puerto `6379`.

### 3. Backend (NestJS API)

```bash
cd backend
pnpm install
npx prisma migrate dev
npx ts-node src/database/seed/seed.ts
pnpm start:dev
```

- **API URL**: `http://localhost:4000/api/v1`
- **Swagger Docs**: `http://localhost:4000/api/v1/docs`
- **Health Check**: `http://localhost:4000/api/v1/health`

**Credenciales iniciales (Seed):**

- Administrador: `admin@vivelite.pe` / `Admin123!`
- Vendedor: `vendedor@vivelite.pe` / `Vendedor123!`
- Repartidor: `repartidor@vivelite.pe` / `Repartidor123!`

### 4. Frontend (Next.js 15 Mobile-First)

```bash
cd frontend
pnpm install
pnpm dev
```

- **URL**: `http://localhost:3000`
- Pantalla de Login: `http://localhost:3000/login`
- Panel Operativo: `http://localhost:3000/`

---

## Estructura del Proyecto

```text
vivelite/
├── backend/
│   ├── prisma/             # Schema relacional y migraciones
│   ├── src/
│   │   ├── common/         # Filtros, Interceptores, Guards, Decoradores
│   │   ├── database/       # PrismaService y Seeders
│   │   └── modules/        # Auth, Health, Clientes, Productos, Ventas...
├── frontend/
│   ├── src/
│   │   ├── app/            # App Router (auth, dashboard)
│   │   ├── components/     # UI, Sidebar, MobileNav (táctil para celulares)
│   │   ├── lib/            # Cliente API con tipado estricto
│   │   └── providers/      # TanStack Query Provider
├── docker-compose.yml      # Postgres 16 y Redis 7 con healthchecks
└── README.md
```
