# Informe de Revisión y Evidencias QA - HU-01 (Login Seguro del Odontólogo)
**Proyecto:** Sistema de Gestión para Consultorio Odontológico  
**Normas de Referencia:** ISO/IEC 25010 (Seguridad), IEEE Std 730 / SQAP (Secciones 5, 7, 8 y 17)  
**QA Revisora:** Salinas Vilar María Luciana  
**Rama Evaluada:** `origin/feature/HU-01_login-medico` (commit `dbd6e8e`)  
**Fecha:** 18 de octubre de 2026  
**Estado de la Historia:** ❌ **PENDIENTE / NO CONFORME (Bloqueada por DEF-012 y DEF-013)**

---

## 1. Resumen de la Auditoría de Calidad
Se realizó la auditoría técnica y ejecución de pruebas sobre la implementación de autenticación médica y protección de endpoints clínicos.
- **Hallazgos Críticos:** Se identificó una excepción de seguridad (DEF-013) que desactiva el middleware de autenticación cuando `NODE_ENV === 'test'`. Dado que el pipeline de GitHub Actions (`ci.yml`) ejecuta las pruebas bajo este entorno, la verificación de seguridad queda anulada en CI.
- **Incumplimiento de Proceso (DEF-012):** La rama carece de pruebas unitarias desarrolladas por el autor, infringiendo la Sección 7 del SQAP.
- **Dictamen:** La historia no puede integrarse a `develop` hasta que el autor retire el bypass de seguridad, adapte los tests legacy con token y aporte sus pruebas unitarias.

---

## 2. Evidencias de Pruebas y Defectos (Registro Fotográfico)

### 📸 Captura 1: Formulario de Login Limpio (Frontend E2E - Cypress)
*Verificación de que el formulario no precarga credenciales por defecto (`doctor@clinica.com`) y los campos inician vacíos (subsanación inicial de DEF-009).*

> 📸 **[PEGAR AQUÍ CAPTURA 1: Pantalla del navegador o Cypress con el formulario de login limpio]**

---

### 📸 Captura 2: Bloqueo de Acceso con Credenciales Inválidas (Cypress E2E)
*Comprobación de que el formulario muestra mensaje de error claro al ingresar datos incorrectos y rechaza el acceso sin filtrar tokens ni redirigir.*

> 📸 **[PEGAR AQUÍ CAPTURA 2: Cypress mostrando la prueba de credenciales inválidas aprobada y el mensaje de error]**

---

### 📸 Captura 3: Inspección de Código Fuente - Bypass de Seguridad (DEF-013)
*Líneas en `backend/src/middlewares/auth.middleware.ts` donde se anula la seguridad en modo test:*
```typescript
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  if (process.env.NODE_ENV === 'test') {
    return next(); // ⚠️ VULNERABILIDAD DEF-013: Permite acceso a datos médicos sin token en tests y CI
  }
  return res.status(401).json({ ... });
}
```

> 📸 **[PEGAR AQUÍ CAPTURA 3: Editor de código mostrando el bloque condicional en auth.middleware.ts]**

---

### 📸 Captura 4: Ejecución en Modo Test demostrando el Fallo / Rojo (DEF-013)
*Comando ejecutado en PowerShell:*
```powershell
$env:NODE_ENV="test"; $env:JWT_SECRET="qa"; npx vitest run tests/integration/hu01-login-seguro.qa.test.ts
```
*Resultado:* Falla en `CP-01-07` porque `/api/patients` y `/api/appointments` responden `HTTP 200` en vez de `401 Unauthorized` (2 pruebas fallidas, 7 aprobadas).

> 📸 **[PEGAR AQUÍ CAPTURA 4: Terminal de PowerShell mostrando las 2 pruebas en rojo / FAIL de CP-01-07]**

---

### 📸 Captura 5: Ausencia de Pruebas Unitarias del Autor en la Rama (DEF-012)
*Inspección del historial de commits de la rama `feature/HU-01_login-medico` mostrando que el autor no incluyó pruebas unitarias para el servicio y controlador de autenticación (Sección 7 del SQAP).*

> 📸 **[PEGAR AQUÍ CAPTURA 5: Terminal con git log / git diff o explorador de archivos sin pruebas unitarias del autor]**

---

### 📸 Captura 6: Implementación Criptográfica con Bcrypt y Secreto JWT
*Verificación en `backend/src/utils/auth.utils.ts` de la migración de PBKDF2 a `bcryptjs` con coste 10 y uso de `process.env.JWT_SECRET` sin valores por defecto inseguros.*

> 📸 **[PEGAR AQUÍ CAPTURA 6: Editor mostrando las funciones hashPassword, verifyPassword y verifyToken]**

---

## 3. Acciones Requeridas para el Autor de HU-01
1. **Corregir DEF-013:** Eliminar el bloque `if (process.env.NODE_ENV === 'test') return next();` en `auth.middleware.ts`.
2. **Actualizar Pruebas Legacy:** En las pruebas del backend que requieran consultar `/api/patients` o `/api/appointments`, inyectar un token de prueba válido en la cabecera `Authorization: Bearer <token>` para que pasen legítimamente.
3. **Corregir DEF-012:** Crear las pruebas unitarias correspondientes a `auth.service.ts` y `auth.controller.ts` con cobertura mínima del 80%.
