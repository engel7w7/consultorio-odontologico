# Informe de Calidad - Sprint 4

**Proyecto:** Sistema de Gestión para Consultorio Odontológico  
**QA revisora:** Arancibia Delgado Diego  
**Historias evaluadas:** HU-05 y HU-09  
**Estándares:** ISO/IEC 25010, ISO/IEC 14598, IEEE 730 y SQAP  
**Fecha:** 2 de noviembre de 2026  
**Ramas revisadas:** `feature/HU-05_agendamiento-dinamico`, `feature/HU-09_registro-tratamiento`

## 1. Alcance y método

La revisión se realizó contra las referencias remotas actualizadas con `git fetch origin` y comparando cada rama con `origin/develop`. Se aplicaron los seis niveles definidos en el SQAP: análisis estático, pruebas unitarias, integración, E2E, rendimiento y aceptación.

## 2. Resultados de ejecución

| Nivel SQAP | Evidencia | Resultado | Criterio |
|---|---|---|---|
| Estático | `npm run lint` en frontend | **NO CONFORME** | Termina, pero mantiene advertencias `react(set-state-in-effect)` |
| Unitario | `npm test -- --run` en backend | **PARCIAL** | 243 aprobadas y 2 `expected fail`; no existen suites específicas de HU-05/HU-09 |
| Integración | Suites existentes de Vitest/Supertest | **PARCIAL** | La batería general pasa, pero faltan casos dedicados para solapamiento, duración y registro de tratamiento |
| E2E | Cypress | **NO EJECUTABLE COMO EVIDENCIA DE HU** | No existen `hu05-*.cy.ts` ni `hu09-*.cy.ts` |
| Rendimiento | JMeter | **PENDIENTE** | No se entregó ejecución ni evidencia de p95/error para agenda y registro |
| Aceptación | Flujo con odontólogo | **PENDIENTE** | No se entregó checklist firmado o resultado reproducible |

### Métricas observadas

- Backend: `243 passed`, `2 expected fail`, de 245 pruebas.
- Cobertura medida sobre `feature/HU-05_agendamiento-dinamico`: 97.10% statements, 87.78% branches, 98.50% functions y 97.23% lines; supera el umbral configurado.
- Cobertura medida sobre `feature/HU-09_registro-tratamiento`: 86.22% statements, 75.55% branches, 93.05% functions y 86.95% lines; falla el umbral configurado de ramas del 80%.
- Backend y frontend compilan correctamente.
- El lint no tiene errores bloqueantes, pero conserva advertencias que impiden declarar conformidad estática.

## 3. Evaluación funcional

### HU-05 - Agendamiento dinámico

La implementación contiene cálculo de duraciones de 30, 60 y 120 minutos y validación de solapamiento. El servicio devuelve `409` con código `APPOINTMENT_OVERLAP` para citas `PROGRAMADA` o `ATENDIDA`, y permite intervalos que solo coinciden con citas canceladas.

Sin embargo, no hay pruebas QA específicas que demuestren:

- las tres duraciones desde la interfaz;
- recálculo de la hora final;
- solapamiento contra citas activas;
- permiso de solapamiento contra citas canceladas;
- mensaje visible y usable en el modal;
- flujo completo de creación en Cypress.

**Veredicto HU-05: NO APROBADA todavía.**

### HU-09 - Registro de tratamientos

La implementación incorpora nomenclatura rápida, conversión ISO 3950/FDI, superficies y códigos CIE-10, además del bloqueo de extracciones sin exámenes validados.

Sin embargo, no hay pruebas QA específicas que demuestren:

- `11 Caries`, `1A Caries` y superficies como `24 OD Resina`;
- rechazo o manejo de nomenclatura inválida;
- asociación con el paciente correcto;
- persistencia y respuesta HTTP del registro;
- bloqueo y permiso de extracción según exámenes;
- flujo completo desde la ficha del paciente en Cypress.

La cobertura de ramas de esta rama queda por debajo del umbral SQAP debido principalmente a la utilidad de nomenclatura.

**Veredicto HU-09: NO APROBADA todavía.**

## 4. Dictamen general

**NO APROBADO PARA MERGE.**

Las ramas compilan y la suite general es mayormente satisfactoria, pero no cumplen los criterios de salida del SQAP: cobertura de ramas mínima, pruebas específicas de la historia, E2E, rendimiento y aceptación. Debe registrarse la corrección y repetir la evaluación antes de aprobar.
