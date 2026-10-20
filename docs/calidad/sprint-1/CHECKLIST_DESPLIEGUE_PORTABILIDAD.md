# Checklist de Despliegue y Portabilidad (Ambiente Limpio)
**Entorno de Producción - Sprint 1**  

- [x] **Base de Datos Gestionada (Supabase):**
  - Instancia provisionada en región `us-east-1`.
  - Migración `20261013194447_init_local_test_db` aplicada con `npx prisma migrate deploy`.
  - Tablas `patients` y esquemas relacionales creados satisfactoriamente.
- [x] **API REST Backend (Render):**
  - Web Service `consultorio-odontologico-dzjm` en estado **Live**.
  - Runtime Node.js 20 con compilación TypeScript limpia (`dist/server.js`).
  - Variables de entorno inyectadas: `DATABASE_URL`, `DIRECT_URL`, `NODE_ENV=production`, `PORT=10000`.
  - Endpoint de comprobación operativo: `GET /api/health` -> `{"status":"ok"}`.
- [x] **Frontend Web (Vercel):**
  - Proyecto desplegado sobre runtime Vite + React.
  - Variable `VITE_API_URL` configurada apuntando a la URL del backend de Render (sin trailing slash).
  - Comunicación asíncrona validada sin bloqueos de políticas CORS.
- [x] **Automatización CI/CD (GitHub Actions):**
  - Pipeline ejecuta en orden: Lint -> TypeCheck -> Migraciones en servicio CI -> Vitest (>=80%) -> Supertest -> Build.
  - Secretos registrados de forma segura: `RENDER_DEPLOY_HOOK_URL` y `VERCEL_DEPLOY_HOOK_URL`.
  - Auto-despliegue condicionado al éxito del 100% de los tests.
