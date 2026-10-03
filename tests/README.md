# 🧪 Vivelite Testing Suite Architecture

Este repositorio cuenta con un ecosistema completo y profesional de pruebas automatizadas que abarca:
- **Pruebas Unitarias** (Lógica de negocio, Kardex, SUNAT UBL 2.1).
- **Pruebas de Integración y Concurrencia** (Race condition prevention con PostgreSQL Advisory Locks).
- **Mocking de SUNAT / OSE Staging y Contingencias** (Códigos 0, 0098, 2023 y caídas 503).
- **Flujos End-to-End (E2E)** (Sesiones JWT y pipeline de venta POS).
- **Pruebas de Regresión Visual con Playwright** (Snapshot y verificación de layouts Mobile vs Desktop).
- **Pre-push Hooks con Husky** (Quality gates automáticos antes de subir cambios).

---

## 📁 Estructura del Sistema de Pruebas

```text
vivelite/
├── .husky/
│   └── pre-push                         # Hook Git que bloquea pushes con tests rotos
│
├── .github/workflows/
│   └── tests.yml                        # Pipeline de integración continua (CI/CD)
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── auth-service.test.ts      # Verificación de contraseñas, estado activo y tokens
│   │   │   ├── inventory-service.test.ts # Kardex: ENTRADA, SALIDA, MERMA y AJUSTE
│   │   │   └── sales-service.test.ts     # Validaciones POS, stock, crédito y pago al contado
│   │   └── utils/
│   │       ├── number-to-words.test.ts   # Conversión a texto legal SUNAT (centavos, millones)
│   │       └── ubl-builder.test.ts       # XML UBL 2.1, código QR SUNAT y hash SHA-256
│   │
│   ├── integration/
│   │   ├── api/
│   │   │   ├── auth-api.test.ts          # POST /auth/login, refresh token y 401
│   │   │   ├── billing-api.test.ts       # GET /billing, ventas no facturadas, emisión 404
│   │   │   ├── customers-api.test.ts     # CRUD, conflicto de DNI y balance de envases
│   │   │   └── sales-api.test.ts         # Listados, validación de DTOs y exportación Excel
│   │   ├── billing/
│   │   │   └── sunat-contingency.test.ts # Contingencias SUNAT (0098 duplicado, 2023, 503 caída)
│   │   ├── concurrency/
│   │   │   └── concurrency-sales.test.ts # 5 ventas paralelas y prevención de doble turno
│   │   └── modules/
│   │       └── security-guard.test.ts    # RolesGuard (RBAC y permisos SUPER_ADMIN)
│   │
│   ├── e2e/
│   │   ├── auth/
│   │   │   └── login-workflow.test.ts    # Ciclo de vida completo de sesión y tokens
│   │   └── ventas/
│   │       └── pos-sale-workflow.test.ts # Venta POS en vivo -> Kardex -> Facturación
│   │
│   ├── fixtures/                         # Datasets de prueba tipados
│   │   ├── customers/customers.fixture.ts
│   │   ├── inventory/inventory.fixture.ts
│   │   ├── invoices/invoices.fixture.ts
│   │   ├── products/products.fixture.ts
│   │   ├── sales/sales.fixture.ts
│   │   └── users/users.fixture.ts
│   │
│   ├── mocks/
│   │   ├── jwt.mock.ts                   # Mock de JwtService
│   │   ├── prisma.mock.ts                # Mock de PrismaService con transacciones y executeRaw
│   │   ├── sunat.mock.ts                 # Mock base SUNAT
│   │   └── sunat-mock-server.ts          # Servidor OSE/SUNAT simulador de respuestas y fallas
│   │
│   └── helpers/
│       └── auth-helper.ts                # Generadores de tokens y cabeceras de autorización
│
└── frontend/
    ├── e2e/
    │   └── visual-regression.spec.ts     # Pruebas de regresión visual con Playwright (Mobile/Desktop)
    ├── playwright.config.ts              # Configuración Playwright (Pixel 5 / Desktop Chrome)
    └── src/__tests__/
        ├── components/
        │   └── pos-terminal.test.tsx     # Terminal POS táctil, turnos de caja y carrito
        ├── responsive/
        │   └── responsive-layout.test.tsx# Mobile Bottom Nav vs Desktop Sidebar (JSDOM)
        └── utils/
            └── frontend-utils.test.ts    # formatCurrency, formatDate (seguro) y cn
```

---

## 🚀 Comandos de Ejecución

### 1. Pruebas Globales (Raíz)
```bash
# Ejecutar todas las pruebas (Backend + Frontend)
pnpm test

# Ejecutar con reportes de cobertura unificados
pnpm test:cov

# Ejecutar pruebas de regresión visual con Playwright
pnpm test:visual
```

### 2. Pruebas Backend (Jest + Supertest + Prisma)
Ejecutar desde el directorio `backend/`:
```bash
# Ejecutar todas las pruebas (Unitarias + Integración + Concurrencia + E2E)
pnpm test:all

# Ejecutar reporte de cobertura completo
pnpm test:all:cov

# Ejecutar en modo observación (watch)
pnpm test:watch
```

### 3. Pruebas Frontend (Vitest + Playwright)
Ejecutar desde el directorio `frontend/`:
```bash
# Ejecutar todas las pruebas unitarias y responsive (Vitest)
pnpm test

# Ejecutar pruebas de regresión visual en navegadores reales (Playwright)
pnpm test:visual

# Ejecutar con reporte de cobertura v8
pnpm test:cov
```

---

## 🛡️ Nuevas Capacidades Implementadas

### 1. Pruebas de Carga y Concurrencia
* **Archivo:** [`tests/integration/concurrency/concurrency-sales.test.ts`](file:///c:/Users/bdbr2/vivelite/tests/integration/concurrency/concurrency-sales.test.ts)
* **Solución implementada:** Uso de `pg_advisory_xact_lock(424242)` a nivel de transacción PostgreSQL en [`sales.service.ts`](file:///c:/Users/bdbr2/vivelite/backend/src/modules/sales/sales.service.ts) y transacción atómica en `openShift` en [`cash.service.ts`](file:///c:/Users/bdbr2/vivelite/backend/src/modules/cash/cash.service.ts).
* **Verificación:** Se disparan 5 ventas concurrentes en el mismo milisegundo mediante `Promise.all`. Todas generan correlativos únicos consecutivos (`VTA-2026-XXXXX`) sin errores de clave duplicada (`P2002`). La apertura concurrente de turnos de caja rechaza duplicados con `409 Conflict`.

### 2. Mocking de SUNAT / OSE en Staging y Contingencias
* **Archivos:** [`tests/mocks/sunat-mock-server.ts`](file:///c:/Users/bdbr2/vivelite/tests/mocks/sunat-mock-server.ts) y [`tests/integration/billing/sunat-contingency.test.ts`](file:///c:/Users/bdbr2/vivelite/tests/integration/billing/sunat-contingency.test.ts)
* **Escenarios simulados:**
  * **Éxito (Código 0):** Generación de CDR con constancia de recepción válida.
  * **Comprobante Duplicado (Código 0098):** Validación de comprobante ya presentado ante SUNAT.
  * **RUC Inactivo / No Habido (Código 2023):** Detección y marcado de comprobante como `RECHAZADO`.
  * **Caída Temporal / Timeout (HTTP 503):** Manejo de contingencia donde el comprobante se mantiene en estado `CONTINGENCIA` para reintento automático sin anular la venta en el POS.

### 3. Pruebas de Regresión Visual con Playwright
* **Archivos:** [`frontend/playwright.config.ts`](file:///c:/Users/bdbr2/vivelite/frontend/playwright.config.ts) y [`frontend/e2e/visual-regression.spec.ts`](file:///c:/Users/bdbr2/vivelite/frontend/e2e/visual-regression.spec.ts)
* **Verificaciones en navegadores reales:**
  * **Mobile:** Valida la presencia del área segura táctil (`pb-safe`), Bottom Navigation fija en la parte inferior, Sidebar de escritorio oculto y ausencia total de scroll horizontal indeseado (`scrollWidth <= innerWidth`).
  * **Desktop:** Valida la barra lateral completa (Sidebar), ocultamiento de la navegación móvil (`lg:hidden`) y maquetación de pantalla ancha.

### 4. Hook Pre-Push con Husky
* **Archivo:** [`.husky/pre-push`](file:///c:/Users/bdbr2/vivelite/.husky/pre-push)
* **Funcionamiento:** Configurado mediante `core.hooksPath .husky`. Cada vez que un desarrollador o agente ejecuta `git push`, el hook ejecuta de forma automática:
  1. `pnpm --dir backend test:all` (14 suites, 64 tests).
  2. `pnpm --dir frontend test` (3 suites, 16 tests).
  Si alguna prueba falla, el push es abortado de inmediato para proteger la rama principal.
