# Matriz de Trazabilidad de Pruebas - Sprint 2
**Proyecto:** Consultorio Odontológico | **QA:** Salinas Vilar María Luciana  
**Fecha:** 18 de octubre de 2026 | **Estado Global:** ⚠️ **HU-08: PASS | HU-01: BLOQUEADA (DEF-012, DEF-013)**

---

## 1. Detalle de Casos de Prueba

| HU | Escenario Evaluado | Nivel | Herramienta | Resultado |
| :---: | :--- | :---: | :---: | :---: |
| **HU-08** | Extracción sin exámenes responde 422 y bloquea la cita | API | Vitest / Supertest | ✅ PASS |
| **HU-08** | Extracción con exámenes validados permite agendar | API | Vitest / Supertest | ✅ PASS |
| **HU-08** | Procedimiento distinto sin exámenes permite agendar | API | Vitest / Supertest | ✅ PASS |
| **HU-08** | Sinónimos ("exodoncia", "quirúrgico", "sacar muela") bloquean | API | Vitest / Supertest | ✅ PASS |
| **HU-08** | Paciente inexistente responde 404 | API | Vitest / Supertest | ✅ PASS |
| **HU-08** | Cita con hora fin anterior a inicio responde 400 | API | Vitest / Supertest | ✅ PASS |
| **HU-08** | Alerta roja bloqueante y botón deshabilitado en interfaz | E2E | Cypress | ✅ PASS (5/5) |
| **HU-01** | Credenciales inválidas o no registradas responden 401 | API | Vitest / Supertest | ✅ PASS |
| **HU-01** | Login exitoso retorna token JWT sin exponer contraseña | API | Vitest / Supertest | ✅ PASS |
| **HU-01** | Peticiones con campos vacíos responden 400 | API | Vitest / Supertest | ✅ PASS |
| **HU-01** | `/api/auth/me` sin token o con token falso responde 401 | API | Vitest / Supertest | ✅ PASS |
| **HU-01** | Rutas clínicas (`/patients`, `/appointments`) exigen token en CI | API | Vitest (`NODE_ENV=test`) | ❌ **FAIL (200 en vez de 401 por DEF-013)** |
| **HU-01** | El login no crea usuarios con credenciales por defecto | API | Vitest / Supertest | ✅ PASS |
| **HU-01** | Formulario de login limpio sin claves precargadas | E2E | Cypress | ✅ PASS (3/3) |
| **HU-01** | Pruebas unitarias de autenticación desarrolladas por el autor | Unitario | Vitest | ❌ **FAIL (Ausentes - DEF-012)** |
| **HU-12** | Búsqueda concurrente de pacientes ($p95 \le 2\text{ s}$, err $< 1\%$) | Carga | JMeter | ✅ PASS ($4.0\text{ ms}$) |

---

## 2. Resumen de Ejecución
- **HU-08 (Alerta Extracción):** ✅ **Aprobada (100% PASS)** en API (8/8) y Cypress (5/5). Integrada a `develop`.
- **HU-01 (Login Seguro):** ⚠️ **Bloqueada.** Pasa 7/9 en modo test por bypass condicional (DEF-013) y carece de pruebas unitarias del autor (DEF-012).
- **HU-12 (Desempeño):** ✅ **Aprobada** ($p95 = 4.0\text{ ms}$, 0% fallos, Apdex 1.000).
- **Mantenibilidad:** ✅ **Aprobada** ($94.95\%$ líneas / $83.16\%$ ramas $\ge 80\%$).
