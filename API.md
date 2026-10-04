# Catálogo de APIs REST — Vivelite ERP

## 1. Protocolo y Autenticación

Todas las llamadas al backend deben realizarse sobre HTTPS con encabezado de autorización:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

---

## 2. Endpoints Principales

### Autenticación (`/api/auth`)
- `POST /api/auth/login`: Autentica credenciales y genera tokens JWT (`accessToken` y `refreshToken`).
- `POST /api/auth/refresh`: Renueva el token de acceso mediante token de refresco.
- `GET /api/auth/me`: Devuelve los datos del perfil y roles del usuario autenticado.
- `POST /api/auth/logout`: Revoca la sesión actual.

### Usuarios (`/api/users`)
- `GET /api/users`: Lista usuarios con filtros de búsqueda y rol (`ADMIN`, `SUPER_ADMIN`).
- `POST /api/users`: Crea un nuevo usuario.
- `PATCH /api/users/:id`: Modifica datos o credenciales.
- `PATCH /api/users/:id/toggle-status`: Alterna estado Activo/Inactivo (protege último SUPER_ADMIN).
- `DELETE /api/users/:id`: Soft delete de usuario (protege contra auto-eliminación).

### Ventas y POS (`/api/sales`)
- `GET /api/sales`: Lista ventas con paginación, filtros de cliente, estado y fecha.
- `GET /api/sales/:id`: Detalle completo de la venta, ítems, pagos y comprobante SUNAT.
- `POST /api/sales`: Registra una nueva venta directa POS (control de stock, caja abierta y Kardex).
- `POST /api/sales/:id/cancel`: Anula una venta atómicamente revirtiendo Kardex, deuda y envases.
- `POST /api/sales/:id/ticket-data`: Obtiene payload formateado para impresión de ticket térmico 80mm/58mm.

### Pedidos y Repartos (`/api/orders`)
- `GET /api/orders`: Lista de pedidos con filtros por estado (`PENDIENTE`, `PREPARANDO`, `EN_RUTA`, `ENTREGADO`).
- `POST /api/orders`: Crea un nuevo pedido a domicilio.
- `POST /api/orders/:id/assign`: Asigna repartidor al pedido.
- `PATCH /api/orders/:id/status`: Actualiza estado del pedido siguiendo la máquina de estados.
- `POST /api/orders/:id/deliver`: Liquida la entrega, deduce stock, registra envases y cobra.

### Caja y Turnos (`/api/cash`)
- `GET /api/cash/registers`: Lista cajas y estado de apertura.
- `GET /api/cash/shifts/active`: Consulta el balance en tiempo real del turno abierto.
- `GET /api/cash/shifts/history`: Historial de turnos cerrados con arqueos y diferencias.
- `POST /api/cash/shifts/open`: Apertura turno con fondo inicial.
- `POST /api/cash/shifts/:id/close`: Cierra turno con arqueo físico de efectivo.
- `POST /api/cash/movements`: Registra un ingreso o egreso manual de caja.

### Cuentas por Cobrar (`/api/payments`)
- `GET /api/payments/pending-debts`: Cartera de clientes con saldo deudor pendiente.
- `POST /api/payments`: Registra amortización o pago total de deuda de venta a crédito.

### Facturación Electrónica SUNAT (`/api/sunat`)
- `POST /api/sunat/emit/:saleId`: Genera XML UBL 2.1 firmado y envía a SUNAT/OSE.
- `GET /api/sunat/status/:saleId`: Consulta estado del CDR en SUNAT.
- `POST /api/sunat/void/:saleId`: Genera Comunicación de Baja / Anulación de comprobante.
