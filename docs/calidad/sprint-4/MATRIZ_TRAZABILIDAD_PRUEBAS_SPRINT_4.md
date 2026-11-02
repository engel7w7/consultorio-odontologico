# Matriz de Trazabilidad de Pruebas - Sprint 4

**Historias:** HU-05 y HU-09  
**QA revisora:** Arancibia Delgado Diego  
**Fecha:** 2 de noviembre de 2026  
**Estado global:** NO CONFORME - evidencia específica incompleta

| HU | Caso | Escenario | Nivel | Resultado | Evidencia requerida |
|---|---|---|---|---|---|
| HU-05 | CP-05-01 | Duración de 30 minutos | Unitario/E2E | PENDIENTE | Test de cálculo y Cypress |
| HU-05 | CP-05-02 | Duración de 60 minutos | Unitario/E2E | PENDIENTE | Test de cálculo y Cypress |
| HU-05 | CP-05-03 | Duración de 120 minutos | Unitario/E2E | PENDIENTE | Test de cálculo y Cypress |
| HU-05 | CP-05-04 | Cambiar inicio recalcula fin | E2E | PENDIENTE | Cypress |
| HU-05 | CP-05-05 | Solapamiento con cita PROGRAMADA | Integración | PENDIENTE | Supertest, HTTP 409 |
| HU-05 | CP-05-06 | Solapamiento con cita ATENDIDA | Integración | PENDIENTE | Supertest, HTTP 409 |
| HU-05 | CP-05-07 | Solapamiento con cita CANCELADA | Integración | PENDIENTE | Supertest, creación permitida |
| HU-05 | CP-05-08 | Inicio igual o posterior al fin | Unitario/Integración | PENDIENTE | HTTP 400 |
| HU-05 | CP-05-09 | Mensaje visual de conflicto | E2E | PENDIENTE | Captura o Cypress |
| HU-05 | CP-05-10 | Creación completa desde agenda | E2E | PENDIENTE | Cypress |
| HU-09 | CP-09-01 | `11 Caries` produce FDI 11 y CIE-10 | Unitario | PENDIENTE | Test de parser |
| HU-09 | CP-09-02 | `1A Caries` produce FDI 11 | Unitario | PENDIENTE | Test de parser |
| HU-09 | CP-09-03 | `24 OD Resina` detecta superficies | Unitario | PENDIENTE | Test de parser |
| HU-09 | CP-09-04 | Nomenclatura inválida | Unitario | PENDIENTE | Caso de validación |
| HU-09 | CP-09-05 | Registro persiste en paciente correcto | Integración | PENDIENTE | Supertest y aislamiento |
| HU-09 | CP-09-06 | Tratamiento vacío o inválido | Integración | PENDIENTE | HTTP 400 |
| HU-09 | CP-09-07 | Extracción sin exámenes validados | Integración | PENDIENTE | HTTP 422 y código de seguridad |
| HU-09 | CP-09-08 | Extracción con exámenes validados | Integración/E2E | PENDIENTE | Registro permitido |
| HU-09 | CP-09-09 | Visualización del tratamiento en historial | E2E | PENDIENTE | Cypress |
| HU-09 | CP-09-10 | Cambio de paciente no mezcla historiales | E2E | PENDIENTE | Cypress |
| Ambas | CP-S4-01 | Cobertura mínima de ramas | Unitario | FAIL | 75.55%, objetivo ≥80% |
| Ambas | CP-S4-02 | Lint sin advertencias críticas | Estático | PARCIAL | Advertencias existentes |
| Ambas | CP-S4-03 | p95 ≤2 s y errores <1% | Rendimiento | PENDIENTE | JMeter |
| Ambas | CP-S4-04 | Flujo completado sin ayuda | Aceptación | PENDIENTE | Checklist con odontólogo |

## Resumen

- Suite general backend: 243 aprobadas y 2 `expected fail`.
- Casos específicos HU-05/HU-09 con evidencia ejecutada en las ramas: 0.
- Cobertura de ramas: FAIL, 75.55%.
- E2E, rendimiento y aceptación: pendientes.
