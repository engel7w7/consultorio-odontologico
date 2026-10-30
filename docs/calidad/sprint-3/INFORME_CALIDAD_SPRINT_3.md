# Informe de Calidad - Sprint 3
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Equipo de Aseguramiento de Calidad  
**Estándares:** ISO/IEC 25010 / IEEE Std 730 / SQAP (Secciones 5, 7, 8 y 17)  
**Fecha:** 30 de octubre de 2026  
**Veredicto Final:** APROBADO PARA MERGE A DEVELOP (100% pruebas en verde, 0 defectos abiertos)

---

## 1. Estrategia de Pruebas Evaluada (SQAP Sección 7)

| Nivel | Qué verifica | Herramienta | Responsable | Criterio de salida SQAP | Estado Final Sprint 3 |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Estáticas** | Estilo y análisis del código | ESLint + SonarQube / Oxlint | QA revisor | Lint sin errores; 0 issues blocker/critical | CONFORME (0 errores, 0 advertencias críticas) |
| **Unitarias** | Reglas de negocio escritas con cada HU | Vitest + Vitest Coverage ($\ge 80\%$) | Autor (Dev) + QA | 100% pruebas verdes; $\ge 80\%$ cobertura crítica | CONFORME (100% verdes; >97% cobertura) |
| **Integración** | API, BD y persistencia | Vitest + Supertest | QA de otro integrante | 0 fallos en flujos críticos | CONFORME (0 fallos) |
| **Sistema/E2E** | Flujos completos del odontólogo | Cypress | QA revisor | Escenarios críticos en verde | CONFORME (3 suites completas en verde) |
| **Rendimiento** | Rendimiento y concurrencia | JMeter (`p95 <= 2.0 s`, err `< 1%`) | QA revisor | $p95 \le 2\text{ s}$; error $< 1\%$ | CONFORME ($p95 = 201\text{ ms}$, 0.0% err) |
| **Aceptación** | Uso real del flujo clínico | Prueba con odontólogo | Equipo + Odontólogo | Historias ALTA aceptadas | CONFORME (Aceptadas) |

---

## 2. Evaluación por Historia de Usuario en los 6 Niveles

### HU-10: Historial Cronológico de Tratamientos (PR #38)
- **Autor:** Luxianaa | **Rama:** `feature/HU-10_historial-tratamientos`
- **1. Estáticas:** Advertencia `react(set-state-in-effect)` resuelta en commit `fcfa82c`.
- **2. Unitarias:** 214 tests aprobados en backend con 98.49% de cobertura en líneas.
- **3. Integración:** 9/9 tests en verde en `patient-history.routes.test.ts` garantizando aislamiento entre pacientes.
- **4. Sistema/E2E:** 4/4 escenarios en verde en `hu10-historial-paciente.cy.ts` (orden descendente, ascendente, estado vacío).
- **5. Rendimiento (JMeter):** $p95 = 185\text{ ms}$ (meta $\le 2000\text{ ms}$), error $0.0\%$.
- **6. Aceptación:** Aprobada.

### HU-11: Registro de Cobro en Citas Atendidas (PR #37)
- **Autor:** drArancibiaDelgado | **Rama:** `feature/HU-11_registro-cobro`
- **1. Estáticas:** Emojis retirados de `DailyAgenda.tsx`. Conforme.
- **2. Unitarias:** 179 tests aprobados en backend con 98.68% de cobertura en líneas (100% en `appointment.controller.ts`).
- **3. Integración:** Validación de citas atendidas resuelta en commit `bf2a38d`. Endpoint responde HTTP 422 ante citas no atendidas.
- **4. Sistema/E2E:** 3/3 escenarios en verde en `hu11-registro-cobro.cy.ts` (visualización condicional, modal interactivo y guardado reactivo).
- **5. Rendimiento (JMeter):** $p95 = 220\text{ ms}$ (meta $\le 2000\text{ ms}$), error $0.0\%$.
- **6. Aceptación:** Aprobada.

### HU-13: Recordatorio por WhatsApp (PR #36)
- **Autor:** drArancibiaDelgado | **Rama:** `feature/HU-13_boton-whatsapp`
- **1. Estáticas:** Código limpio y compilación sin advertencias.
- **2. Unitarias:** 166 tests aprobados en backend con 97.69% de cobertura en líneas (7 tests en `whatsapp.utils.test.ts`).
- **3. Integración:** Verificado que `GET /api/appointments` suministra el teléfono del paciente.
- **4. Sistema/E2E:** 3/3 escenarios en verde en `hu13-recordatorio-whatsapp.cy.ts` (enlace wa.me, formato mensaje y aislamiento de clic).
- **5. Rendimiento (JMeter):** $p95 = 198\text{ ms}$ (meta $\le 2000\text{ ms}$), error $0.0\%$.
- **6. Aceptación:** Aprobada.

---

## 3. Estado de Defectos - Sprint 3

| ID | HU | Nivel | Severidad | Defecto Detectado | Estado Final |
| :---: | :---: | :---: | :---: | :--- | :---: |
| **DEF-014** | HU-11 | E2E | S2 (Media) | Ausencia de pruebas E2E en Cypress para cobros | CERRADO (QA) |
| **DEF-015** | HU-11 | Negocio | S3 (Media) | Servicio permitía cobrar citas no atendidas | CERRADO (Dev) |
| **DEF-016** | HU-11 | Unitario | S4 (Baja) | Ramas 404/500 y esquema sin cobertura unitaria | CERRADO (QA) |
| **DEF-017** | HU-13 | E2E | S2 (Media) | Ausencia de pruebas E2E en Cypress para WhatsApp | CERRADO (QA) |
| **DEF-018** | HU-13 | Unitario | S3 (Media) | Utilidad de WhatsApp sin pruebas unitarias | CERRADO (QA) |
| **DEF-019** | HU-10 | Estática | S4 (Baja) | Advertencia de linter react(set-state-in-effect) | CERRADO (Dev) |

---

## 4. Dictamen Final de QA
Se han verificado satisfactoriamente los cambios en las tres ramas remotas (`feature/HU-10_historial-tratamientos`, `feature/HU-11_registro-cobro` y `feature/HU-13_boton-whatsapp`). Todas las pruebas unitarias, de integración, de rendimiento y E2E se encuentran en verde con coberturas superiores al 97%.  

**Veredicto:** **APROBADO PARA MERGE A DEVELOP**.
