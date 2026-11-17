# Matriz de Trazabilidad de Pruebas - Sprint 4

**Proyecto:** Sistema de Gestión para Consultorio Odontológico
**Historias:** HU-05, HU-09, HU-14 y HU-15
**QA revisora:** Arancibia Delgado Diego
**Fecha de actualización:** 4 de noviembre de 2026
**Rama de evidencia:** `qa/sprint-4-e2e-fixes`

| HU | Caso | Escenario | Nivel | Resultado | Evidencia |
|---|---|---|---|---|---|
| HU-05 | CP-05-01 | Duraciones de 30, 60 y 120 minutos | Unitario | PASS | `appointment.service.test.ts`; controles en `DailyAgenda.tsx` |
| HU-05 | CP-05-02 | Solapamiento con cita activa | Unitario | PASS | `appointment.service.test.ts`; código `APPOINTMENT_OVERLAP` |
| HU-05 | CP-05-03 | Creación sin solapamiento | Unitario | PASS | `appointment.service.test.ts` |
| HU-05 | CP-05-04 | Flujo completo y mensaje visual de conflicto | E2E | PENDIENTE | Falta `hu05-*.cy.ts` |
| HU-09 | CP-09-01 | Parser FDI, superficies y CIE-10 | Unitario | PASS | `fdi-notation.utils.test.ts` |
| HU-09 | CP-09-02 | Registro de tratamiento en paciente | Integración | PASS | `patient-history.routes.test.ts` |
| HU-09 | CP-09-03 | Extracción sin exámenes validados | Integración | PASS | `patient-history.service.test.ts` y controlador |
| HU-09 | CP-09-04 | Flujo completo y visualización del historial | E2E | PENDIENTE | Falta `hu09-*.cy.ts` |
| HU-14 | CP-14-01 | Lista de profilaxis vencida y días de atraso | E2E | PASS | `hu14-profilaxis-vencida.cy.ts`, 1/1 |
| HU-14 | CP-14-02 | Paciente reagendado sin acción de agendar | E2E | PASS | `hu14-profilaxis-vencida.cy.ts`, 1/1 |
| HU-14 | CP-14-03 | Agendar profilaxis para paciente no reagendado | E2E | PASS | `hu14-profilaxis-vencida.cy.ts`, 1/1 |
| HU-15 | CP-15-01 | Lista mensual, ingreso y priorización | E2E | PASS | `hu15-lista-retorno.cy.ts`, 1/1 |
| HU-15 | CP-15-02 | Enlace de WhatsApp normalizado | E2E | PASS | `hu15-lista-retorno.cy.ts`, 1/1 |
| HU-15 | CP-15-03 | Navegación entre meses | E2E | PASS | `hu15-lista-retorno.cy.ts`, 1/1 |
| HU-15 | CP-15-04 | Exclusión de pacientes reagendados | E2E | PASS | `hu15-lista-retorno.cy.ts`, 1/1 |
| HU-14/HU-15 | CP-S4-01 | Cobertura de historias | Unitario/Integración | PASS | HU-14: 88.35% branches; HU-15: 88.75% branches |
| HU-05/HU-09 | CP-S4-02 | Cobertura mínima de ramas | Unitario | PARCIAL | HU-05: 87.78%; HU-09: 75.55%, objetivo ≥80% |
| Todas | CP-S4-03 | Login y consulta autenticada de agenda | Rendimiento | PASS funcional | Plan JMeter; samples HTTP 200 |
| Todas | CP-S4-04 | p95 ≤2 s y errores <1% | Rendimiento | PENDIENTE | Falta reporte `.jtl`/HTML con métricas |
| Todas | CP-S4-05 | Aceptación con odontólogo | Aceptación | PENDIENTE | Falta checklist firmado |

## Resumen

- HU-05: pruebas unitarias específicas en verde; E2E dedicada pendiente.
- HU-09: pruebas unitarias, de controlador e integración en verde; E2E dedicada y cobertura de ramas ≥80% pendientes.
- HU-14: 3/3 pruebas Cypress aprobadas.
- HU-15: 4/4 pruebas Cypress aprobadas.
- JMeter: login y consulta autenticada respondieron HTTP 200; p95 y porcentaje de error pendientes de documentar.
