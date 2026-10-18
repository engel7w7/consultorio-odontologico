# Informe de Calidad - Sprint 2
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Salinas Vilar María Luciana  
**Estándares:** ISO/IEC 25010 / IEEE Std 730 / SQAP (Secciones 5, 7, 8 y 17)  
**Fecha:** 18 de octubre de 2026  
**Veredicto Final:** ⚠️ **PENDIENTE (HU-01 no apta para merge a develop)**

---

## 1. Resumen de Métricas (ISO/IEC 25010 - Sección 5)

| Característica | Métrica Evaluada | Meta SQAP | Resultado Obtenido | Estado |
| :--- | :--- | :---: | :---: | :---: |
| **Adecuación Funcional (HU-08)** | Bloqueo de extracciones sin exámenes válidos | 100% | **100%** (8/8 API, 5/5 E2E) | ✅ Conforme |
| **Seguridad (HU-01)** | Control de acceso y protección de rutas clínicas | 0 fallos altos | **1 abierto (DEF-013)** + 1 proceso (DEF-012) | ❌ **No conforme** |
| **Rendimiento (HU-12)** | Tiempo de respuesta p95 en búsqueda de pacientes | $\le 2.0\text{ s}$ | **$4.0\text{ ms}$** (0.0% errores) | ✅ Conforme |
| **Mantenibilidad** | Cobertura global de código (Vitest Coverage) | $\ge 80\%$ | **94.9% líneas** / **83.2% ramas** | ✅ Conforme |

---

## 2. Estado de las Historias de Usuario

### HU-08: Alerta Bloqueante de Extracción
- **Estado:** ✅ **Aprobada e Integrada en `develop`.**
- **Resultado:** Cumple al 100% las pruebas de integración (8/8) y E2E (5/5) tras corregir los sinónimos clínicos y códigos HTTP.

### HU-01: Login Seguro de Odontólogo
- **Estado:** ❌ **Bloqueada / Pendiente del autor.**
- **Motivo de Bloqueo:**
  1. **DEF-013 (Seguridad Alta):** `backend/src/middlewares/auth.middleware.ts` incluye un bypass condicional `if (process.env.NODE_ENV === 'test') return next();`. Como GitHub Actions corre en modo test (`NODE_ENV: test`), la seguridad de los endpoints se apaga en el CI.
  2. **DEF-012 (Proceso - Sección 7 SQAP):** La rama carece de pruebas unitarias desarrolladas por el autor de la historia. Las pruebas de integración de QA no las reemplazan.

### HU-12: Desempeño en Búsqueda de Pacientes
- **Estado:** ✅ **Aprobada.**
- **Prueba de Carga (JMeter):** 20 usuarios simultáneos, 200 peticiones a `/api/patients?search=Juan`. p95 de $4.0\text{ ms}$, 0% errores, Apdex 1.000.

---

## 3. Estado de Defectos
- **Total defectos identificados:** 10 (DEF-004 a DEF-013).
- **Cerrados:** 8 (DEF-004 a DEF-011).
- **Abiertos:** 2 (**DEF-012** y **DEF-013**).

---

## 4. Dictamen Final de QA
De acuerdo con la Sección 8 del SQAP, mientras existan defectos de seguridad altos abiertos, la historia no puede ser integrada a `develop`.  
**Dictamen:** **PENDIENTE.** Se solicita al autor de HU-01 retirar el bypass de seguridad, actualizar los tests legacy para que envíen token y aportar sus pruebas unitarias.
