# Registro de Defectos y Bloqueos de Calidad - Sprint 1
**Estándar:** IEEE Std 730 / ISO/IEC 14598 (Sección 8 del SQAP)  

| ID Defecto | Historia | Severidad | Descripción del Problema | Causa Raíz | Acción Correctiva | Responsable | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | US-02 / US-07 | **S1 (Crítica - Bloqueo)** | Pipeline rechazó el PR por cobertura global del 62.96% (inferior al umbral del 80%). | Falta de pruebas unitarias y de integración sobre las ramas lógicas de `patient.controller.ts` y esquemas de validación Zod. | Se corrigió el esquema y se incorporaron casos de prueba para paths positivos y negativos del controlador, elevando la cobertura a más del 90%. | Jhojan Romero (Dev) / Diego Arancibia (QA) | **Cerrado / Resuelto** |
| **DEF-002** | US-04 | **S1 (Crítica - Bloqueo)** | Despliegue rechazado en GitHub Actions por caída de cobertura al 70.78% en PR de agenda. | Controlador y servicio de agenda sin cobertura de casos límite (solapamiento y fechas nulas). | Se agregaron tests de Vitest para servicio y controlador de agenda, alcanzando 100% en líneas y 88% en branches. | Luciana Salinas (Dev) / Diego Arancibia (QA) | **Cerrado / Resuelto** |
| **DEF-003** | US-07 | **S2 (Alta)** | Petición `PATCH /blood-exams` arrojaba error 404 en producción. | Desalineación en el nombre del path entre el router backend y la llamada frontend (`/blood-exams` vs `sample-patient-id`). | Se homologó la ruta en `patient.routes.js` para recibir `/:id/blood-exams` y se vinculó la creación con el UUID dinámico de Supabase. | Jhojan Romero | **Cerrado / Resuelto** |

> **Regla de Despliegue (Sección 8):** Ningún defecto S1 o S2 permaneció abierto al momento del merge y release a producción.
