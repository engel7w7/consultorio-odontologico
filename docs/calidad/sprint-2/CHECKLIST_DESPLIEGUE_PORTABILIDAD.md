# Checklist de Despliegue y Portabilidad (Ambiente Limpio)
**Entorno de Producción - Sprint 2**  
_(Marcar cada punto después de verificarlo en el release `develop` → `main`.)_

- [ ] **Base de Datos Gestionada (Supabase):**
  - Migraciones nuevas aplicadas con `npx prisma migrate deploy`: `add_users_table` (HU-01) y `add_medical_history_audit` (HU-03).
  - Tabla `users` creada con al menos un odontólogo real (sin credenciales por defecto).
- [ ] **API REST Backend (Render):**
  - Web Service en estado **Live** con `NODE_ENV=production`.
  - Variable `JWT_SECRET` configurada en Render (el servidor falla al iniciar sesión si no existe).
  - `GET /api/health` → `{"status":"ok"}`.
  - `GET /api/patients` **sin token** → **401** (control de acceso activo en producción).
- [ ] **Frontend Web (Vercel):**
  - Pantalla de login sin credenciales precargadas.
  - Login correcto → acceso a Registro, Buscador, Validación, Agenda y Antecedentes.
  - Agenda: botones Atender/Cancelar operativos (HU-06); alerta roja de extracción (HU-08).
- [ ] **Automatización CI/CD (GitHub Actions):**
  - Pipeline en verde sobre `main`: Lint → TypeCheck → Migraciones → Vitest (≥80%) → Supertest → Build.
  - "Despliegue Continuo a Producción" ejecutado con éxito tras el merge a `main`.
