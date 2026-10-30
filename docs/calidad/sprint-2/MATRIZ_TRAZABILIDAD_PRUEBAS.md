# Matriz de Trazabilidad de Pruebas y Criterios de Aceptación - Sprint 2

| Historia de Usuario | Escenario Crítico Evaluado | Nivel de Prueba | Herramienta | Archivo de Prueba | Resultado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-08** | Extracción sin exámenes responde 422 y la cita **no** se crea. | Integración API | Supertest + Vitest | `backend/tests/integration/hu08-alerta-extraccion.qa.test.ts` | **PASS** |
| **HU-08** | Sinónimos ("Exodoncia", "quirúrgico", "sacar muela") también bloquean. | Integración API | Supertest + Vitest | `backend/tests/integration/hu08-alerta-extraccion.qa.test.ts` | **PASS** |
| **HU-08** | Extracción con exámenes validados y procedimientos no invasivos se agendan (201). | Integración API | Supertest + Vitest | `backend/tests/integration/hu08-alerta-extraccion.qa.test.ts` | **PASS** |
| **HU-08** | Paciente inexistente → 404; hora fin anterior a inicio → 400. | Integración API | Supertest + Vitest | `backend/tests/integration/hu08-alerta-extraccion.qa.test.ts` | **PASS** |
| **HU-08** | Banner de alerta roja visible y botón deshabilitado en la interfaz. | E2E | Cypress | `frontend/cypress/e2e/hu08-alerta-extraccion.cy.ts` | **PASS** (5/5) |
| **HU-01** | Credenciales inválidas no permiten acceso (401, sin token). | Integración API | Supertest + Vitest | `backend/tests/integration/hu01-login-seguro.qa.test.ts` | **PASS** |
| **HU-01** | Login válido devuelve token sin exponer la contraseña; campos vacíos → 400. | Integración API | Supertest + Vitest | `backend/tests/integration/hu01-login-seguro.qa.test.ts` | **PASS** |
| **HU-01** | `/api/auth/me` sin token o con token falsificado → 401. | Integración API | Supertest + Vitest | `backend/tests/integration/hu01-login-seguro.qa.test.ts` | **PASS** |
| **HU-01** | Datos clínicos (`/patients`, `/appointments`) no accesibles sin sesión. | Integración API | Supertest + Vitest | `backend/tests/integration/hu01-login-seguro.qa.test.ts` | **FAIL conocido** (DEF-013, marcado `it.fails`) |
| **HU-01** | El login no crea usuarios con credenciales por defecto. | Integración API | Supertest + Vitest | `backend/tests/integration/hu01-login-seguro.qa.test.ts` | **PASS** |
| **HU-01** | Hash bcrypt, token, middleware y servicio de autenticación. | Unitaria | Vitest | `backend/tests/unit/auth.*.test.ts` (autor) | **PASS** |
| **HU-01** | Credenciales inválidas en la interfaz; formulario sin claves precargadas. | E2E | Cypress | `frontend/cypress/e2e/hu01-login.cy.ts` | **PASS** (3/3) |
| **HU-06** | Cambio a ATENDIDA / CANCELADA → 200 con el nuevo estado. | Integración API | Supertest + Vitest | `backend/tests/integration/hu06-estado-cita.qa.test.ts` | **PASS** |
| **HU-06** | El registro **no** se elimina: solo se actualiza el campo `estado`. | Integración API | Supertest + Vitest | `backend/tests/integration/hu06-estado-cita.qa.test.ts` | **PASS** |
| **HU-06** | Estado inválido → 400; cita inexistente → 404. | Integración API | Supertest + Vitest | `backend/tests/integration/hu06-estado-cita.qa.test.ts` | **PASS** |
| **HU-06** | Atender/Cancelar en la agenda, persistencia al recargar y manejo de error. | E2E | Cypress | `frontend/cypress/e2e/hu06-estado-cita.cy.ts` | **PASS** (4/4) |
| **HU-12** | Búsqueda por nombre (sin distinguir mayúsculas) y por teléfono. | Integración API | Supertest + Vitest | `backend/tests/integration/hu12-buscador-pacientes.qa.test.ts` | **PASS** |
| **HU-12** | Búsqueda vacía devuelve todos; espacios ignorados; caracteres especiales sin error. | Integración API | Supertest + Vitest | `backend/tests/integration/hu12-buscador-pacientes.qa.test.ts` | **PASS** |
| **HU-12** | Búsqueda de más de 100 caracteres → 400. | Integración API | Supertest + Vitest | `backend/tests/integration/hu12-buscador-pacientes.qa.test.ts` | **PASS** |
| **HU-12** | Buscar por nombre/teléfono, sin resultados, limpiar búsqueda, error del servidor. | E2E | Cypress | `frontend/cypress/e2e/hu12-buscador-pacientes.cy.ts` | **PASS** (5/5) |
| **HU-12 / HU-04** | p95 de búsqueda y agenda $\le 2$ s con error $< 1\%$. | Rendimiento | JMeter | `docs/calidad/sprint-2/plan-rendimiento-sprint2.jmx` | **PASS** (p95 = 421 ms, 0.00% errores) |
| **Todas** | Regresión completa del backend (unitarias + integración). | Unitaria / Integración | Vitest Coverage | `backend/tests/**` | **PASS** (160/160; cobertura 98.36% líneas) |
