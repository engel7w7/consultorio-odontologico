# Informe de Evaluación de Calidad - Sprint 2
**Proyecto:** Sistema de Gestión para Consultorio Odontológico  
**Normas de Referencia:** ISO/IEC 25010, ISO/IEC 14598, IEEE Std 730  
**Fecha de Cierre:** _(completar al cerrar el sprint)_  
**Alcance:** HU-08, HU-01, HU-06, HU-12 (10 Puntos de Historia)  

---

## 1. Resumen Ejecutivo
Durante el Sprint 2 se implementaron el login seguro del odontólogo (HU-01), la alerta roja bloqueante de extracción (HU-08), el cambio de estado de citas (HU-06) y el buscador de pacientes (HU-12). La revisión de QA detectó un defecto crítico (DEF-004, S1) que permitía eludir la alerta de extracción y tres hallazgos de seguridad altos en el login; todos fueron corregidos y verificados con las mismas pruebas que los detectaron. Permanece abierto **DEF-013** (excepción de autenticación en modo de pruebas), que no afecta a producción pero impide verificar el control de acceso en el pipeline. También se registraron hallazgos de proceso (ramas desactualizadas, commits directos a `develop`, merge con lint en rojo) con sus acciones correctivas.

---

## 2. Medición de Características de Calidad (ISO/IEC 25010 - Sección 5)

| Característica | Métrica Evaluada | Objetivo SQAP | Resultado Medido | Estado | Evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Adecuación Funcional** | Casos críticos de bloqueo de extracción (HU-08) | $100\%$ | **100%** (API 8/8, E2E 5/5) | **Aprobado** | `hu08-alerta-extraccion.qa.test.ts`, `hu08-alerta-extraccion.cy.ts` |
| **Adecuación Funcional** | Cambio de estado sin pérdida del registro (HU-06) | $100\%$ | **100%** (API 7/7, E2E 4/4) | **Aprobado** | `hu06-estado-cita.qa.test.ts`, `hu06-estado-cita.cy.ts` |
| **Adecuación Funcional** | Búsqueda retorna al paciente correcto (HU-12) | $100\%$ | **100%** (API 9/9, E2E 5/5) | **Aprobado** | `hu12-buscador-pacientes.qa.test.ts`, `hu12-buscador-pacientes.cy.ts` |
| **Seguridad** | Hallazgos altos/críticos de control de acceso (HU-01) | 0 | **1 abierto (DEF-013)** | **No conforme** | `hu01-login-seguro.qa.test.ts` (CP-01-07) |
| **Eficiencia de desempeño** | p95 de búsqueda (HU-12) y agenda (HU-04) | $\le 2$ s; error $< 1\%$ | _(pendiente)_ | **Pendiente** | `plan-rendimiento-sprint2.jmx` |
| **Mantenibilidad** | Cobertura de Líneas (Lines) | $\ge 80.0\%$ | **98.36%** | **Aprobado** | Vitest Coverage |
| **Mantenibilidad** | Cobertura de Ramas (Branches) | $\ge 80.0\%$ | **88.61%** | **Aprobado** | Vitest Coverage |
| **Mantenibilidad** | Cobertura de Funciones (Functions) | $\ge 80.0\%$ | **100.00%** | **Aprobado** | Vitest Coverage |
| **Mantenibilidad** | Cobertura de Sentencias (Statements) | $\ge 80.0\%$ | **98.17%** | **Aprobado** | Vitest Coverage |

> **Nota sobre rendimiento:** la medición anterior (`jmeter-statistics-hu12.json`, p95 = 4 ms) se considera **no válida**: se ejecutó antes de que existiera el buscador real de HU-12 y sin token de autenticación. Se repetirá con `plan-rendimiento-sprint2.jmx` sobre `develop` integrado.
>
> **Nota sobre cobertura:** medición del 20/10/2026 sobre HU-06 integrada con `develop` (160 pruebas, 18 archivos). Actualizar con la ejecución final de `npm run test:coverage` sobre `develop` al cierre del sprint.

---

## 3. Desglose de Cobertura por Paquete (Vitest Coverage Report)

- **`src/`:** 100% Statements | 62.5% Branches | 100% Functions | 100% Lines
- **`src/config/`:** 100% Statements | 100% Branches | 100% Functions | 100% Lines
- **`src/controllers/`:** 97.61% Statements | 88.42% Branches | 100% Functions | 97.61% Lines
- **`src/middlewares/`:** 100% Statements | 100% Branches | 100% Functions | 100% Lines
- **`src/routes/`:** 100% Statements | 100% Branches | 100% Functions | 100% Lines
- **`src/schemas/`:** 100% Statements | 90% Branches | 100% Functions | 100% Lines
- **`src/services/`:** 97.74% Statements | 87.62% Branches | 100% Functions | 98.23% Lines
- **`src/utils/`:** 98.21% Statements | 97.22% Branches | 100% Functions | 98.03% Lines

---

## 4. Dictamen por Historia de Usuario

| HU | Autor | Pruebas QA | Defectos | Dictamen |
| :--- | :--- | :--- | :--- | :--- |
| **HU-08** Alerta Extracción | Romero Morales Jhojan Erick | API 8/8 · E2E 5/5 | DEF-004 (S1), DEF-005 a DEF-007, DEF-014 → cerrados | **Conforme** |
| **HU-01** Login Seguro | Romero Morales Jhojan Erick | API 7/9 (2 = DEF-013) · E2E 3/3 | DEF-008 a DEF-012 cerrados · **DEF-013 abierto** | **Conforme con observación** (no afecta producción) |
| **HU-06** Estado de Cita | Arancibia Delgado Diego Roberto | API 7/7 · E2E 4/4 | DEF-015 cerrado · DEF-017 observación | **Conforme** |
| **HU-12** Buscador | Arancibia Delgado Diego Roberto | API 9/9 · E2E 5/5 · JMeter pendiente | DEF-015 cerrado · DEF-017 observación | **Conforme** (rendimiento pendiente) |

### Evidencias (carpeta `evidencias/`)
- `hu08-*.png`: pruebas antes/después de la corrección, alerta roja en interfaz.
- `hu01-*.png`: login vacío, Cypress, CP-01-07 con `NODE_ENV=test`.
- `hu06-*.png`: cobertura, Cypress, cambio de estado en la agenda.
- `hu12-*.png`: integración, Cypress, buscador en interfaz.
- `jmeter-*.png`: tabla Statistics del reporte (pendiente).

---

## 5. Dictamen de Conformidad y Aprobación Cruzada
Se cumple la regla de independencia de revisión (Sección 3 del SQAP: nadie aprueba su propio código). En HU-08 (riesgo de exposición 9) se requiere doble revisión QA (Sección 14).

- **Desarrolladores / Autores:** Romero Morales Jhojan Erick (HU-01, HU-08) · Arancibia Delgado Diego Roberto (HU-06, HU-12)
- **Revisora de QA / Auditora:** Salinas Vilar María Luciana
- **Segunda revisión QA HU-08:** _(completar)_
- **Veredicto Final:** **CONFORME CON OBSERVACIONES.** No existen defectos S1 abiertos (Sección 8). Quedan pendientes DEF-013 (seguridad, sin impacto en producción), DEF-016 (proceso) y la medición de rendimiento con JMeter.
