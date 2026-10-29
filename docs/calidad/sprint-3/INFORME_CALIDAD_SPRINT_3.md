# Informe de Calidad - Sprint 3
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Equipo de Aseguramiento de Calidad  
**Estándares:** ISO/IEC 25010 / IEEE Std 730 / SQAP (Secciones 5, 7, 8 y 17)  
**Fecha:** 29 de octubre de 2026  
**Veredicto:** PENDIENTE DE CORRECCIONES EN DESARROLLO (Pruebas de QA incorporadas)

---

## 1. Resumen de Métricas (ISO/IEC 25010 - Sección 5)

| Característica | Métrica Evaluada | Meta SQAP | Resultado Obtenido | Estado |
| :--- | :--- | :---: | :---: | :---: |
| **Adecuación Funcional (HU-10)** | Historial cronológico ordenado sin mezclar pacientes | 100% | **100%** (9/9 API, 4/4 E2E) | CONFORME |
| **Adecuación Funcional (HU-11)** | Registro de cobros restringido a citas atendidas | 100% | **En proceso** (Pruebas E2E y unitarias añadidas por QA) | PENDIENTE (Dev) |
| **Adecuación Funcional (HU-13)** | Generación de enlaces WhatsApp con formato boliviano (+591) | 100% | **100%** (7/7 unitarios, 3/3 E2E) | CONFORME (Pruebas listas) |
| **Mantenibilidad Global** | Cobertura de código crítica (Vitest Coverage) | $\ge 80\%$ | **>97.5% líneas** / **>87% ramas** | CONFORME |
| **Confiabilidad / Seguridad** | Control de acceso con token en todas las rutas clínicas | 0 fallos críticos | **0 fallos abiertos** | CONFORME |

---

## 2. Estado de las Historias de Usuario evaluadas

### HU-10: Historial Cronológico de Tratamientos (PR #38)
- **Autor:** Luxianaa
- **Rama:** `feature/HU-10_historial-tratamientos`
- **Estado de QA:** **APROBADA CON OBSERVACIÓN MENOR**
- **Resultados:**
  - Pruebas unitarias: 23/23 tests en verde (100% cobertura en servicio).
  - Pruebas de integración: 9/9 tests en verde en `patient-history.routes.test.ts`.
  - Pruebas E2E: 4/4 escenarios en verde en `hu10-historial-paciente.cy.ts`.
- **Observación pendiente:** Resolver advertencia de linter `react(set-state-in-effect)` en `PatientHistory.tsx`.

### HU-11: Registro de Cobros en Citas Atendidas (PR #37)
- **Autor:** drArancibiaDelgado
- **Rama:** `feature/HU-11_registro-cobro`
- **Estado de QA:** **OBSERVADA (DEF-015 abierto en regla de negocio)**
- **Resultados:**
  - Pruebas unitarias: QA agregó cobertura de `registerPaymentSchema` y ramas 404/500 en `appointment.controller.test.ts` (100% líneas).
  - Pruebas E2E: QA agregó suite Cypress completa en `hu11-registro-cobro.cy.ts` (3 escenarios).
- **Acción requerida del autor:** Restringir `registerPayment` en el servicio para que rechace cobros si la cita no está en estado `ATENDIDA`.

### HU-13: Recordatorio de Cita por WhatsApp (PR #36)
- **Autor:** drArancibiaDelgado
- **Rama:** `feature/HU-13_boton-whatsapp`
- **Estado de QA:** **APROBADA (Batería de pruebas completada por QA)**
- **Resultados:**
  - Pruebas unitarias: QA creó `whatsapp.utils.test.ts` con 7 tests validando prefijos bolivianos `591`, formato y sanitización.
  - Pruebas E2E: QA creó `hu13-recordatorio-whatsapp.cy.ts` con 3 escenarios validando enlace seguro y aislamiento de clics.
- **Acción requerida del autor:** Hacer `git pull origin feature/HU-13_boton-whatsapp` y verificar sanitización ante teléfonos nulos.

---

## 3. Estado de Defectos - Sprint 3

| ID | HU | Severidad | Defecto Detectado | Estado |
| :---: | :---: | :---: | :--- | :---: |
| **DEF-014** | HU-11 | S2 (Media) | Ausencia de pruebas E2E en Cypress para el flujo de cobros | CERRADO (QA) |
| **DEF-015** | HU-11 | S3 (Media) | Cobro permitido sobre citas no atendidas (falta validación) | ABIERTO (Dev) |
| **DEF-016** | HU-11 | S4 (Baja) | Ramas 404/500 y esquema de cobro sin cobertura unitaria | CERRADO (QA) |
| **DEF-017** | HU-13 | S2 (Media) | Ausencia de pruebas E2E en Cypress para botón de WhatsApp | CERRADO (QA) |
| **DEF-018** | HU-13 | S3 (Media) | Utilidad de WhatsApp sin suite de pruebas unitarias | CERRADO (QA) |
| **DEF-019** | HU-10 | S4 (Baja) | Advertencia de linter react(set-state-in-effect) en PatientHistory | ABIERTO (Dev) |

---

## 4. Dictamen Final de QA
Las pruebas requeridas por la Sección 7 del SQAP han sido implementadas e integradas por QA en las ramas remotas. Se autorizará el merge a `develop` una vez que los desarrolladores apliquen las correcciones de negocio reportadas (DEF-015 y DEF-019).
