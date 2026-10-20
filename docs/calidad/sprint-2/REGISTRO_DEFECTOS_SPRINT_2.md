# Registro de Defectos y Bloqueos de Calidad - Sprint 2
**Estándar:** IEEE Std 730 / ISO/IEC 14598 (Sección 8 del SQAP)  

## Defectos

| ID Defecto | Historia | Severidad | Descripción del Problema | Causa Raíz | Acción Correctiva | Responsable | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-004** | HU-08 | **S1 (Crítica - Bloqueo)** | La alerta de extracción se eludía con "Exodoncia pieza 38", "Procedimiento quirúrgico" o "Sacar muela del juicio": la cita se creaba sin exámenes. | Detección por expresión regular sobre texto libre con pocos términos y sin tildes. | Regex ampliada (`exodoncia`, `quir[uú]rg`, `muela`) en backend y frontend (`c2f00dd`). | Jhojan Romero (Dev) / Luciana Salinas (QA) | **Cerrado / Resuelto** |
| **DEF-005** | HU-08 | **S3 (Media)** | El bloqueo respondía HTTP 500 en vez de 422. | El servicio lanzaba un mensaje distinto al que comparaba el controlador. | Comparación por código de error (`c2f00dd`, `9835bcc`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-006** | HU-08 | **S3 (Media)** | Paciente inexistente respondía 500 en vez de 404. | Identificador de error no sincronizado entre servicio y controlador. | Código `PATIENT_NOT_FOUND` unificado (`c2f00dd`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-007** | HU-08 | **S3 (Media)** | Se aceptaban citas con hora de fin anterior a la de inicio. | Validación presente en el controlador pero nunca ejecutada. | `.refine()` en el esquema Zod → 400 (`c2f00dd`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-008** | HU-01 | **Alta (Seguridad)** | Los endpoints clínicos respondían sin token. | El login solo ocultaba la interfaz; no había middleware. | Middleware `requireAuth` en rutas clínicas (`dbd6e8e`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-009** | HU-01 | **Alta (Seguridad)** | Usuario demo creado en cada login (también en producción) y credenciales precargadas en pantalla. | `ensureDefaultDoctorExists()` y valores iniciales en `DoctorLogin.tsx`. | Eliminados (`dbd6e8e`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-010** | HU-01 | **Alta (Seguridad)** | Secreto JWT con valor por defecto publicado en el repositorio. | Fallback en `auth.utils.ts`. | `JWT_SECRET` obligatorio desde variables de entorno (`dbd6e8e`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-011** | HU-01 | **S3 (Media)** | Hash PBKDF2 (1000 iteraciones) en lugar de bcrypt (Sección 17). | Implementación criptográfica propia. | `bcryptjs` con costo 10 (`dbd6e8e`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-012** | HU-01 | **S2 (Alta - Proceso)** | La rama no incluía pruebas unitarias del autor (Sección 7). | Pruebas no escritas durante el desarrollo. | Pruebas `auth.*.test.ts` agregadas (`d8404a0`). | Jhojan Romero | **Cerrado / Resuelto** |
| **DEF-013** | HU-01 | **Alta (Seguridad)** | `requireAuth` deja pasar sin token cuando `NODE_ENV === 'test'`; el CI corre en ese modo, por lo que el control de acceso no se verifica en el pipeline. | Excepción agregada para que las pruebas antiguas (sin token) siguieran pasando. | Quitar la excepción y hacer que las pruebas envíen un token válido. Prueba QA CP-01-07 marcada `it.fails` hasta su corrección. | Jhojan Romero | **Abierto** |
| **DEF-014** | HU-08 | **S2 (Alta - Proceso)** | `develop` quedó con ESLint en rojo (`no-explicit-any`) después del merge del PR #24, bloqueando el pipeline del equipo. | Uso de `(error as any).code` y merge sin verificar el pipeline completo. | Clase de error tipada (`9835bcc`, `e6469a7`). Checklist QA: no aprobar sin el check SQAP en verde. | Jhojan Romero (Dev) / Luciana Salinas (QA) | **Cerrado / Resuelto** |
| **DEF-015** | HU-06 / HU-12 | **S2 (Alta - Proceso)** | Ramas creadas desde `develop` del 14/10: 56 commits atrás y con conflictos (8 y 3 archivos). | No se actualizó la rama base antes de desarrollar (Estándar Scrum, Sección 4). | Ramas actualizadas con `develop` y conflictos resueltos (`fbb96ba`, `6cfe6b2`). | Diego Arancibia | **Cerrado / Resuelto** |
| **DEF-016** | Proceso | **S3 (Media - Proceso)** | Commits subidos directamente a `develop` sin Pull Request ni revisión (p. ej. `d65d8c9`, 20/10). | `develop` no está protegida en GitHub. | Activar regla de protección en `develop` (PR obligatorio + 1 revisión + check SQAP). | Equipo | **Abierto** |
| **DEF-017** | HU-06 / HU-12 | **S4 (Baja - Proceso)** | Commits con formato `feat(HU-06): ...` en lugar de `[HU-06][feat]: ...`. | Uso de Conventional Commits en vez del Estándar Scrum del equipo. | Aplicar el formato del estándar en los siguientes commits. | Diego Arancibia | **Abierto (observación)** |

## Observaciones (no bloquean el release)

| ID | Historia | Observación | Recomendación |
| :--- | :--- | :--- | :--- |
| **OBS-01** | HU-08 | La detección sigue siendo por texto libre: "Exéresis de pieza 48" o "Sacar diente" no activan la alerta; "Limpieza en molar 36" se bloquea (falso positivo). | Selector fijo `tipo_procedimiento` (backlog). |
| **OBS-02** | HU-06 | Se permite cambiar una cita CANCELADA a ATENDIDA y viceversa. | Validar la regla de transición con el odontólogo. |
| **OBS-03** | HU-12 | El buscador muestra nombre y teléfono pero no abre la ficha médica que menciona la HU. | Agregar enlace a la ficha (criterio de aceptación parcial). |
| **OBS-04** | Proceso | Cypress no se ejecuta en el pipeline y no figura en `frontend/package.json` (SQAP 9.3c). | Agregar `cypress` como devDependency y el paso `npx cypress run` al CI. |

> **Regla de Despliegue (Sección 8):** no existen defectos S1 abiertos al cierre de la revisión. DEF-013 (seguridad alta) no afecta a producción (`NODE_ENV=production`), pero mantiene la métrica de Seguridad como **No conforme** hasta su corrección.
