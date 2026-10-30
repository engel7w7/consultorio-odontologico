# Registro de Defectos - Sprint 3
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Equipo de Aseguramiento de Calidad  
**Estándar:** IEEE Std 730 / SQAP (Secciones 7 y 8) | **Fecha:** 30 de octubre de 2026  
**Estado General:** 100% DEFECTOS CERRADOS (6/6 Cerrados)

---

| ID | HU | Severidad | Defecto Detectado | Acción Correctiva Aplicada | Estado Final |
| :---: | :---: | :---: | :--- | :--- | :---: |
| **DEF-014** | HU-11 | **S2 (Media)** | Ausencia de pruebas E2E en Cypress para el flujo crítico de registro de cobro del odontólogo. | Creación de `frontend/cypress/e2e/hu11-registro-cobro.cy.ts` con cobertura de visualización, modal y guardado reactivo. | CERRADO (QA) |
| **DEF-015** | HU-11 | **S3 (Media)** | El servicio `registerPayment` no validaba el estado de la cita, permitiendo registrar cobros en citas canceladas o programadas. | Validación incorporada en `appointment.service.ts` y respuesta HTTP 422 en `appointment.controller.ts`. Pruebas en verde. | CERRADO (Dev) |
| **DEF-016** | HU-11 | **S4 (Baja)** | Falta de pruebas unitarias para `registerPaymentSchema` y ramas de error 404/500 en `appointment.controller.ts`. | Implementadas suites unitarias en schema y controller, elevando cobertura de líneas al 100%. | CERRADO (QA) |
| **DEF-017** | HU-13 | **S2 (Media)** | Ausencia de prueba E2E en Cypress para el botón de recordatorio por WhatsApp en la agenda diaria. | Creación de `frontend/cypress/e2e/hu13-recordatorio-whatsapp.cy.ts` con validación de URL `wa.me/591...` y aislamiento de eventos. | CERRADO (QA) |
| **DEF-018** | HU-13 | **S3 (Media)** | Las utilidades `normalizeWhatsAppPhone` y `buildWhatsAppReminderUrl` contaban con 0% de pruebas unitarias. | Implementada suite en `backend/tests/unit/whatsapp.utils.test.ts` con 7 casos cubriendo formato boliviano y sanitización. | CERRADO (QA) |
| **DEF-019** | HU-10 | **S4 (Baja)** | Advertencia de linter `react(set-state-in-effect)` en `PatientHistory.tsx` al actualizar estado síncrono en `useEffect`. | El autor encapsuló la llamada dentro de eventos de usuario/carga desacoplada, eliminando la advertencia. | CERRADO (Dev) |

---

> **Criterio de Aceptación y Despliegue (SQAP Sección 8):**  
> Todos los defectos identificados (DEF-014 al DEF-019) han sido cerrados satisfactoriamente. Se emite veredicto de APROBACIÓN para el merge de los PR #36 (HU-13), #37 (HU-11) y #38 (HU-10) a la rama `develop`.
