# Informe de Evaluación de Calidad - Sprint 1
**Proyecto:** Sistema de Gestión para Consultorio Odontológico  
**Normas de Referencia:** ISO/IEC 25010, ISO/IEC 14598, IEEE Std 730  
**Fecha de Cierre:** 14 de octubre de 2026  
**Alcance:** HU-02, HU-07, HU-03, HU-04 (9 Puntos de Historia)  

---

## 1. Resumen Ejecutivo
Durante el Sprint 1 se implementaron las historias clínicas fundacionales del sistema. El Quality Gate de Integración Continua (CI) detuvo inicialmente los despliegues por métricas inferiores al 80%, forzando la corrección y adición de pruebas de integración y controladores. El resultado final del reporte de cobertura global de Vitest superó ampliamente los umbrales mínimos requeridos.

---

## 2. Medición de Características de Calidad (ISO/IEC 25010 - Sección 5)

| Característica | Métrica Evaluada | Objetivo SQAP | Resultado Medido | Estado | Evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mantenibilidad** | Cobertura de Líneas (Lines) | $\ge 80.0\%$ | **99.40%** (166/167) | **Aprobado** | Reporte Vitest Coverage (HTML) |
| **Mantenibilidad** | Cobertura de Ramas (Branches) | $\ge 80.0\%$ | **87.23%** (82/94) | **Aprobado** | Reporte Vitest Coverage (HTML) |
| **Mantenibilidad** | Cobertura de Funciones (Functions) | $\ge 80.0\%$ | **100.00%** (28/28) | **Aprobado** | Reporte Vitest Coverage (HTML) |
| **Mantenibilidad** | Cobertura de Sentencias (Statements) | $\ge 80.0\%$ | **99.40%** (167/168) | **Aprobado** | Reporte Vitest Coverage (HTML) |
| **Adecuación Funcional** | Casos críticos aprobados (HU-02, HU-07) | $100\%$ | **100%** pasaron en verde | **Aprobado** | Vitest + Supertest en GitHub Actions |
| **Fiabilidad** | Persistencia y aislamiento sin mezcla de datos (HU-03) | $100\%$ | **100%** en suite aislada | **Aprobado** | Supertest + Contenedor PostgreSQL CI |
| **Portabilidad** | Despliegue en ambiente limpio en la nube | $100\%$ exitosa | **100%** operativo | **Aprobado** | Render (API) + Vercel (Web) + Supabase |
| **Seguridad** | Exposición de secretos y control de acceso | 0 críticos / S1 | **0 hallazgos críticos** | **Aprobado** | Variables en GitHub Secrets y .env excluido |

---

## 3. Desglose de Cobertura por Paquete (Vitest Coverage Report)

- **`src/`:** 100% Statements | 75.0% Branches | 100% Functions | 100% Lines
- **`src/config/`:** 100% Statements | 100% Branches | 100% Functions | 100% Lines
- **`src/controllers/`:** 100% Statements | 90.62% Branches | 100% Functions | 100% Lines
- **`src/routes/`:** 100% Statements | 100% Branches | 100% Functions | 100% Lines
- **`src/schemas/`:** 100% Statements | 100% Branches | 100% Functions | 100% Lines
- **`src/services/`:** 97.77% Statements | 83.33% Branches | 100% Functions | 97.72% Lines
- **`src/utils/`:** 100% Statements | 100% Branches | 100% Functions | 100% Lines

---

## 4. Dictamen de Conformidad y Aprobación Cruzada
Se cumple estrictamente la regla de independencia de revisión (Sección 3 del SQAP: nadie aprueba su propio código).

- **Desarrollador / Autor:** Romero Morales Jhojan Erick
- **Revisor de QA / Auditor:** Arancibia Delgado Diego Roberto
- **Revisora de QA / Auditora:** Salinas Vilar María Luciana
- **Veredicto Final:** **CONFORME - APTO PARA RELEASE v1.0.0**
