# Registro de Defectos - Sprint 4

**Proyecto:** Sistema de Gestión para Consultorio Odontológico  
**QA revisora:** Arancibia Delgado Diego  
**Fecha:** 2 de noviembre de 2026  
**Estado general:** 6 hallazgos abiertos

| ID | HU | Severidad | Defecto o incumplimiento | Evidencia | Estado |
|---|---|---|---|---|---|
| DEF-020 | HU-05 | S2 Media | La rama no contiene pruebas unitarias o de integración específicas para duración dinámica y solapamiento. | Comparación con `origin/develop`; solo suites generales existentes. | ABIERTO |
| DEF-021 | HU-05 | S2 Media | Falta prueba E2E del flujo de agendamiento y del mensaje visual de conflicto. | No existe `frontend/cypress/e2e/hu05-*.cy.ts`. | ABIERTO |
| DEF-022 | HU-09 | S2 Media | La rama no contiene pruebas específicas del parser ISO 3950, superficies y CIE-10. | No existe suite dedicada para `fdi-notation.utils.ts`. | ABIERTO |
| DEF-023 | HU-09 | S2 Media | Falta prueba de integración/E2E para registrar tratamiento, asociarlo al paciente y bloquear extracciones inseguras. | No existe `frontend/cypress/e2e/hu09-*.cy.ts` ni integración dedicada. | ABIERTO |
| DEF-024 | HU-09 | S2 Media | La cobertura de ramas no alcanza el umbral SQAP configurado. | `npm run test:coverage` en HU-09: 75.55%, objetivo 80%; HU-05 obtiene 87.78%. | ABIERTO |
| DEF-025 | Ambas | S3 Baja | El lint conserva advertencias `react(set-state-in-effect)` en componentes del frontend. | `npm run lint`. | ABIERTO |

## Acciones correctivas solicitadas

1. Agregar pruebas unitarias para cálculo de duración, solapamiento y parser de nomenclatura.
2. Agregar pruebas Supertest para los endpoints críticos, incluidos 400, 404, 409 y 422.
3. Agregar suites Cypress `hu05-agendamiento-dinamico.cy.ts` y `hu09-registro-tratamiento.cy.ts`.
4. Elevar la cobertura de ramas a mínimo 80% y adjuntar el reporte.
5. Ejecutar JMeter y registrar p95 y porcentaje de error.
6. Ejecutar aceptación con odontólogo y adjuntar checklist.

## Criterio de cierre

Los defectos se cierran únicamente cuando existe evidencia reproducible, las pruebas críticas están en verde y la métrica correspondiente cumple el objetivo del SQAP. Mientras exista una prueba crítica pendiente o cobertura inferior al umbral, no se recomienda aprobar el merge.
