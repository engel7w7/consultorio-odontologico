# Registro de Defectos - Sprint 4

**Proyecto:** Sistema de Gestión para Consultorio Odontológico
**QA revisora:** Arancibia Delgado Diego
**Fecha de actualización:** 4 de noviembre de 2026
**Historias:** HU-05, HU-09, HU-14 y HU-15

| ID | HU | Severidad | Defecto o incumplimiento | Evidencia | Estado |
|---|---|---|---|---|---|
| DEF-020 | HU-05 | S2 Media | Inicialmente faltaban pruebas específicas de duración y solapamiento. | Corregido con casos en `appointment.service.test.ts`. | CERRADO |
| DEF-021 | HU-05 | S2 Media | Falta suite E2E del agendamiento dinámico y mensaje visual de conflicto. | No existe `frontend/cypress/e2e/hu05-*.cy.ts`. | ABIERTO |
| DEF-022 | HU-09 | S2 Media | Inicialmente faltaban pruebas específicas del parser ISO 3950, superficies y CIE-10. | Cubierto por `fdi-notation.utils.test.ts`. | CERRADO |
| DEF-023 | HU-09 | S2 Media | Falta suite E2E para registrar tratamiento, asociarlo al paciente y visualizarlo. | No existe `frontend/cypress/e2e/hu09-*.cy.ts`. | ABIERTO |
| DEF-024 | HU-09 | S2 Media | La cobertura de ramas queda debajo del umbral SQAP. | 75.55%, objetivo mínimo 80%. | ABIERTO |
| DEF-025 | HU-05/HU-09 | S3 Baja | Persisten advertencias de lint `react(set-state-in-effect)`. | Salida de `npm run lint`. | ABIERTO |
| DEF-026 | Todas | S2 Media | No se ha adjuntado reporte cuantitativo de rendimiento. | JMeter funcional en HTTP 200; faltan p95 y porcentaje de error. | ABIERTO |
| DEF-027 | Todas | S3 Baja | Falta evidencia de aceptación con odontólogo. | No se ha adjuntado checklist firmado. | ABIERTO |

## Evidencia incorporada

- HU-05: pruebas unitarias de solapamiento en `backend/tests/unit/appointment.service.test.ts`.
- HU-09: pruebas de parser, servicio, controlador e integración.
- HU-14: 3/3 pruebas Cypress aprobadas.
- HU-15: 4/4 pruebas Cypress aprobadas.
- JMeter: plan en `docs/calidad/sprint-4/jmeter/sprint-4-jmeter.jmx`; login y consulta de agenda respondieron HTTP 200.

## Acciones pendientes

1. Agregar `hu05-*.cy.ts` y `hu09-*.cy.ts`.
2. Elevar la cobertura de ramas de HU-09 a mínimo 80%.
3. Generar y adjuntar el reporte JMeter con p95, porcentaje de error, throughput y samples.
4. Ejecutar y documentar la aceptación con odontólogo.

Mientras permanezca una prueba crítica pendiente, cobertura inferior al umbral o métrica de rendimiento sin evidencia, no se recomienda declarar el Sprint 4 completamente cerrado.
