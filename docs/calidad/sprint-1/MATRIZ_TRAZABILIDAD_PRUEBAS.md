# Matriz de Trazabilidad de Pruebas y Criterios de Aceptación

| Historia de Usuario | Escenario Crítico Evaluado | Nivel de Prueba | Herramienta | Archivo de Prueba | Resultado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-02** | Paciente registrado persiste en BD y queda disponible en directorio. | Integración API | Supertest + Vitest | `backend/tests/integration/patient.test.ts` | **PASS** |
| **HU-02** | Validación de esquema Zod ante campos obligatorios vacíos o mal formateados. | Unitaria | Vitest | `backend/tests/unit/patient.schema.test.ts` | **PASS** |
| **HU-07** | Activación del check de exámenes deja al paciente con Luz Verde Médica (`examenes_sangre_validados = true`). | Integración / Lógica | Supertest + Vitest | `backend/tests/integration/bloodExams.test.ts` | **PASS** |
| **HU-07** | Intentar validar exámenes de un ID inexistente retorna HTTP 404 controlado. | Integración API | Supertest | `backend/tests/integration/bloodExams.test.ts` | **PASS** |
| **HU-03** | Registro y recuperación de antecedentes médicos críticos sin pérdida de datos. | Integración | Supertest | `backend/tests/integration/medicalHistory.test.ts` | **PASS** |
| **HU-04** | Agenda diaria lista las citas en orden cronológico correcto. | Lógica / UI | Vitest + Cypress | `frontend/tests/agenda.test.tsx` | **PASS** |
