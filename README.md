# Sistema de Gestión para Consultorio Odontológico

Sistema web para la gestión integral de historias clínicas, registro de pacientes y control pre-operatorio (validación de exámenes médicos).

---

## 🚀 Entornos de Base de Datos (Local y Nube)

El proyecto soporta tanto ejecución local con **Docker** como conexión a **Supabase (PostgreSQL en la nube)** mediante Prisma.

### Opción 1: Base de Datos Local con Docker (Recomendada para Desarrollo y Pruebas)

1. **Iniciar el contenedor de PostgreSQL:**
   ```bash
   docker compose up -d
   ```
   * Servicio: PostgreSQL 15 en `localhost:5433`
   * Base de datos: `consultorio_test_db`
   * Usuario: `test_user` / Contraseña: `test_password`

2. **Configurar `backend/.env`:**
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://test_user:test_password@localhost:5433/consultorio_test_db?schema=public"
   DIRECT_URL="postgresql://test_user:test_password@localhost:5433/consultorio_test_db?schema=public"
   ```

3. **Aplicar migraciones:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

---

### Opción 2: Base de Datos en la Nube con Supabase

Para conectar a tu proyecto en Supabase, edita `backend/.env`:

```env
PORT=3000
NODE_ENV=development
# Puerto 6543 (Transaction Pooler con pgbouncer):
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Puerto 5432 (Conexión directa para migraciones DDL):
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

---

## 🧪 Pruebas y Cobertura (Vitest >= 80%)

```bash
cd backend
npm run test:coverage
npm run test:integration
```
