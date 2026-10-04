# Política y Guía de Seguridad — Vivelite ERP

## 1. Modelo de Seguridad y Control de Acceso

Vivelite ERP implementa un esquema de seguridad multicapa (*Defense in Depth*) enfocado en proteger datos financieros, inventarios y comprobantes tributarios.

---

## 2. Medidas de Seguridad Implementadas

### A. Autenticación y Criptografía
- **Hashing de Contraseñas:** Algoritmo **Bcrypt** con costo factor 10 y salt criptográfico por usuario.
- **Tokens JWT:** Firma HMAC-SHA256 con tiempo de expiración corto (15 min para Access Token, 7 días para Refresh Token).
- **Protección contra Fuerza Bruta:** Throttling / Rate Limiting configurado en endpoints sensibles de autenticación (`/api/auth/login`).

### B. Autorización y RBAC (Role-Based Access Control)
- **Roles Definidos:** `SUPER_ADMIN`, `ADMIN`, `SUPERVISOR`, `CAJERO`, `VENDEDOR`, `REPARTIDOR`.
- **Validación en Backend:** Todos los endpoints están protegidos por `JwtAuthGuard` y `RolesGuard`. La interfaz gráfica únicamente refleja los permisos que el backend autoriza de manera estricta.
- **Protección contra Auto-Eliminación e IDOR:** Bloqueo de auto-eliminación o auto-desactivación del usuario en sesión y protección del último `SUPER_ADMIN` activo.

### C. Seguridad en la Capa HTTP y Red
- **Cabeceras HTTP Seguras:** Implementación de **Helmet** (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`).
- **CORS Configurado:** Restricción estricta de dominios autorizados mediante variables de entorno (`FRONTEND_URL`).
- **Prevención de Inyecciones:**
  - SQL Injection: Consultas parametrizadas obligatorias a través de Prisma ORM y `$executeRaw` tipado.
  - XSS: Sanitización de entradas con `class-validator` y escape automático en React 19.

### D. Concurrencia y Transacciones ACID
- Bloqueo pesimista distribuido con `pg_advisory_xact_lock` para evitar ventas fantasmas o saldos de inventario inconsistentes en momentos de alta concurrencia.
- Manejo de auditoría inmutable en tabla `audit_logs` que registra quién, cuándo y qué campos modificó en cada operación sensible.
