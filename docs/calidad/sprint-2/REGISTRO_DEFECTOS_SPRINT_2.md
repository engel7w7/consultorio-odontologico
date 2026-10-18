# Registro de Defectos - Sprint 2
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Salinas Vilar María Luciana  
**Estándar:** IEEE Std 730 / SQAP (Secciones 7 y 8) | **Fecha:** 18 de octubre de 2026  
**Estado General:** ⚠️ **2 Defectos Abiertos en HU-01 (Bloquea integración)**

---

| ID | HU | Severidad | Defecto Detectado | Acción Correctiva Requerida | Estado Final |
| :---: | :---: | :---: | :--- | :--- | :---: |
| **DEF-004** | HU-08 | **S1 (Crítica)** | Elusión del bloqueo de extracción usando sinónimos ("exodoncia", "cirugía", "sacar muela"). | Regex ampliada en frontend y backend para incluir todos los sinónimos clínicos. | ✅ **Cerrado** |
| **DEF-005** | HU-08 | **S3 (Media)** | El backend respondía HTTP 500 en vez de 422 al bloquear la extracción. | Controlador captura código `EXTRACTION_BLOOD_EXAMS_REQUIRED` y responde 422. | ✅ **Cerrado** |
| **DEF-006** | HU-08 | **S3 (Media)** | Paciente inexistente generaba HTTP 500 en vez de 404. | Identificador `PATIENT_NOT_FOUND` sincronizado en service y controller (404). | ✅ **Cerrado** |
| **DEF-007** | HU-08 | **S3 (Media)** | Permitía crear citas con hora de fin anterior a la de inicio. | Validación de rango de horas implementada en Zod y servicio (HTTP 400). | ✅ **Cerrado** |
| **DEF-008** | HU-01 | **Alta (Seguridad)** | Endpoints clínicos (`/patients`, `/appointments`) sin middleware de autorización. | Middleware `requireAuth` añadido en las rutas clínicas (HTTP 401 si falta token). | ✅ **Cerrado** (en producción) |
| **DEF-009** | HU-01 | **Alta (Seguridad)** | Creación automática de usuario demo y credenciales precargadas en pantalla. | Eliminada función `ensureDefaultDoctorExists()` y formulario de login limpio. | ✅ **Cerrado** |
| **DEF-010** | HU-01 | **Alta (Seguridad)** | Secreto JWT con valor por defecto inseguro en código fuente. | Secreto cargado obligatoriamente desde `.env` (falla al arrancar si falta). | ✅ **Cerrado** |
| **DEF-011** | HU-01 | **S3 (Media)** | Contraseñas hasheadas con PBKDF2 en lugar de bcrypt (exigido por SQAP Sec. 17). | Migración a librería `bcryptjs` con salt rounds = 10. | ✅ **Cerrado** |
| **DEF-012** | HU-01 | **S2 (Alta - Proceso)** | La rama del autor carece de pruebas unitarias (incumplimiento Sección 7 del SQAP). | El autor de HU-01 debe implementar sus pruebas unitarias en `backend/src/`. | ❌ **Abierto** |
| **DEF-013** | HU-01 | **Alta (Seguridad)** | Bypass de autenticación en modo test (`if (NODE_ENV === 'test') return next()`) en `auth.middleware.ts`. Invalida la seguridad en el CI de GitHub. | Eliminar bypass condicional y hacer que las pruebas legacy envíen un token válido. | ❌ **Abierto** |

---

> **Regla de Despliegue (Sección 8 del SQAP):** La presencia de hallazgos de seguridad abiertos (DEF-013) y falta de pruebas unitarias del autor (DEF-012) impide la integración de `feature/HU-01_login-medico` a `develop` hasta su resolución.
