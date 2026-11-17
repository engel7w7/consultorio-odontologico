# Matriz de Trazabilidad de Pruebas y Criterios de Aceptación

**Sprint:** 1
**Historias:** HU-02, HU-07, HU-03 y HU-04
**Fecha de revisión documental:** 4 de noviembre de 2026

| Historia de Usuario | Escenario Crítico Evaluado | Nivel de Prueba | Herramienta | Archivo de Prueba | Resultado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-02** | Paciente registrado persiste y queda disponible en directorio. | Unitaria / integración / E2E | Vitest + Supertest + Cypress | `backend/tests/unit/patient.service.test.ts`; `backend/tests/integration/patient.routes.test.ts`; `frontend/cypress/e2e/pacientes.cy.ts` | **PASS** |
| **HU-02** | Validación de campos obligatorios y datos inválidos. | Unitaria / integración | Vitest + Supertest | `backend/tests/unit/patient.controller.test.ts`; `backend/tests/integration/patient.routes.test.ts` | **PASS** |
| **HU-07** | Validar exámenes deja al paciente con Luz Verde Médica. | Unitaria / integración / E2E | Vitest + Supertest + Cypress | `backend/tests/unit/patient.service.test.ts`; `backend/tests/integration/patient.routes.test.ts`; `frontend/cypress/e2e/pacientes.cy.ts` | **PASS** |
| **HU-07** | ID inexistente devuelve HTTP 404 controlado. | Unitaria / integración | Vitest + Supertest | `backend/tests/unit/patient.controller.test.ts`; `backend/tests/integration/patient.routes.test.ts` | **PASS** |
| **HU-03** | Registro y recuperación de antecedentes médicos críticos. | Unitaria / integración / E2E | Vitest + Supertest + Cypress | `backend/tests/unit/medical-history.service.test.ts`; `backend/tests/unit/medical-history.controller.test.ts`; `backend/tests/integration/patient.routes.test.ts`; `frontend/cypress/e2e/antecedentes.cy.ts` | **PASS** |
| **HU-04** | Agenda diaria carga y muestra citas. | Unitaria / integración / E2E | Vitest + Supertest + Cypress | `backend/tests/unit/appointment.service.test.ts`; `backend/tests/unit/appointment.controller.test.ts`; `backend/tests/integration/appointment.routes.test.ts`; `frontend/cypress/e2e/agenda.cy.ts` | **PASS** |
