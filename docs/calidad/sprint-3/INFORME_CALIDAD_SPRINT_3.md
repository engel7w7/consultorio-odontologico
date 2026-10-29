# Informe de Calidad - Sprint 3
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Equipo de Aseguramiento de Calidad  
**Estándares:** ISO/IEC 25010 / IEEE Std 730 / SQAP (Secciones 5, 7, 8 y 17)  
**Fecha:** 29 de octubre de 2026  
**Veredicto:** PENDIENTE DE CORRECCIONES EN DESARROLLO (HU-11 con regla de negocio observada)

---

## 1. Estrategia de Pruebas Evaluada (SQAP Sección 7)

| Nivel | Qué verifica | Herramienta | Responsable | Criterio de salida SQAP | Estado Sprint 3 |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Estáticas** | Estilo y análisis del código | ESLint + SonarQube / Oxlint | QA revisor | Lint sin errores; 0 issues blocker/critical | OBSERVADO (1 advertencia en HU-10) |
| **Unitarias** | Reglas de negocio escritas con cada HU | Vitest + Vitest Coverage ($\ge 80\%$) | Autor (Dev) + QA | 100% pruebas verdes; $\ge 80\%$ cobertura crítica | OBSERVADO (3 fallos en HU-11) |
| **Integración** | API, BD y persistencia | Vitest + Supertest | QA de otro integrante | 0 fallos en flujos críticos | OBSERVADO (1 fallo 422 en HU-11) |
| **Sistema/E2E** | Flujos completos del odontólogo | Cypress | QA revisor | Escenarios críticos en verde | CONFORME (3 suites listas) |
| **Rendimiento** | Rendimiento y concurrencia | JMeter (`p95 <= 2.0 s`, err `< 1%`) | QA revisor | $p95 \le 2\text{ s}$; error $< 1\%$ | CONFORME ($p95 = 201\text{ ms}$, 0% err) |
| **Aceptación** | Uso real del flujo clínico | Prueba con odontólogo | Equipo + Odontólogo | Historias ALTA aceptadas | PENDIENTE (espera de corrección) |

---

## 2. Evaluación por Historia de Usuario en los 6 Niveles

### HU-10: Historial Cronológico de Tratamientos (PR #38)
- **Estáticas:** 1 advertencia menor `react(set-state-in-effect)` en `PatientHistory.tsx:101`. Requiere corrección.
- **Unitarias:** 23/23 tests en verde (100% cobertura de servicio y esquema).
- **Integración:** 9/9 tests en verde en `patient-history.routes.test.ts` (aislamiento garantizado entre pacientes).
- **Sistema/E2E:** 4/4 escenarios en verde en `hu10-historial-paciente.cy.ts` (orden desc/asc, estado vacío, cambio de paciente).
- **Rendimiento (JMeter):** $p95 = 185\text{ ms}$ (meta $\le 2000\text{ ms}$), error $0.0\%$. Conforme.
- **Aceptación:** Cumple criterio de visualización cronológica clara para el odontólogo.

### HU-11: Registro de Cobro en Citas Atendidas (PR #37)
- **Estáticas:** Emojis detectados en `DailyAgenda.tsx`. Requiere limpieza visual.
- **Unitarias:** 2 fallos en pruebas unitarias por permitir cobrar citas no atendidas (DEF-015).
- **Integración:** 1 fallo en integración esperando HTTP 422 ante cita no atendida.
- **Sistema/E2E:** Suite completa en `hu11-registro-cobro.cy.ts` (3 escenarios cubiertos).
- **Rendimiento (JMeter):** $p95 = 220\text{ ms}$ (meta $\le 2000\text{ ms}$), error $0.0\%$. Conforme.
- **Aceptación:** Bloqueada hasta restringir cobros únicamente a citas con estado `ATENDIDA`.

### HU-13: Recordatorio por WhatsApp (PR #36)
- **Estáticas:** Código limpio sin advertencias blocker/critical.
- **Unitarias:** 7/7 tests unitarios en verde en `whatsapp.utils.test.ts` validando formato `+591`.
- **Integración:** Verificado que `GET /api/appointments` incluye teléfono para construcción de enlace.
- **Sistema/E2E:** 3/3 escenarios en verde en `hu13-recordatorio-whatsapp.cy.ts` (enlace wa.me, mensaje y aislamiento de clic).
- **Rendimiento (JMeter):** $p95 = 198\text{ ms}$ (meta $\le 2000\text{ ms}$), error $0.0\%$. Conforme.
- **Aceptación:** Cumple criterio de generación de enlace directo hacia WhatsApp para el odontólogo.

---

## 3. Estado de Defectos - Sprint 3

| ID | HU | Nivel | Severidad | Defecto Detectado | Estado |
| :---: | :---: | :---: | :---: | :--- | :---: |
| **DEF-014** | HU-11 | E2E | S2 (Media) | Ausencia de pruebas E2E en Cypress para cobros | CERRADO (QA) |
| **DEF-015** | HU-11 | Negocio | S3 (Media) | Servicio permite cobrar citas no atendidas | ABIERTO (Dev) |
| **DEF-016** | HU-11 | Unitario | S4 (Baja) | Ramas 404/500 y esquema sin cobertura unitaria | CERRADO (QA) |
| **DEF-017** | HU-13 | E2E | S2 (Media) | Ausencia de pruebas E2E en Cypress para WhatsApp | CERRADO (QA) |
| **DEF-018** | HU-13 | Unitario | S3 (Media) | Utilidad de WhatsApp sin pruebas unitarias | CERRADO (QA) |
| **DEF-019** | HU-10 | Estática | S4 (Baja) | Advertencia de linter react(set-state-in-effect) | ABIERTO (Dev) |

---

## 4. Dictamen Final de QA
Para autorizar el merge a `develop`:
1. El autor de **HU-11** debe implementar la validación de estado `ATENDIDA` en service y responder 422 en controller para poner las 3 pruebas fallidas en verde.
2. La autora de **HU-10** debe corregir la llamada síncrona en `useEffect` de `PatientHistory.tsx`.
3. El autor de **HU-13** debe hacer pull de las pruebas ya aportadas por QA.
