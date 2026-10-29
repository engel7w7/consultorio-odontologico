# Matriz de Trazabilidad de Pruebas - Sprint 3
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Equipo de Aseguramiento de Calidad  
**Fecha:** 29 de octubre de 2026 | **Estándar:** IEEE Std 730 / SQAP (Sección 7)

---

## 1. Detalle de Casos de Prueba

| HU | Caso | Escenario Evaluado | Nivel | Herramienta | Resultado |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **HU-10** | CP-10-01 | Listado de tratamientos en orden desc (más reciente primero) | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-02 | Parámetro ?orden=asc consulta en orden ascendente | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-03 | Aislamiento estricto: no mezcla citas de distintos pacientes | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-04 | Paciente sin tratamientos responde 200 con array vacío | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-05 | Paciente inexistente responde 404 | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-06 | ID no UUID responde 400 | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-07 | Parámetro de orden inválido responde 400 | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-08 | Petición sin token responde 401 | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-09 | Petición con token inválido responde 401 | API | Vitest / Supertest | PASS |
| **HU-10** | CP-10-E2E-01 | Selección de paciente muestra línea de tiempo más reciente arriba | E2E | Cypress | PASS |
| **HU-10** | CP-10-E2E-02 | Selector interactivo de orden actualiza la vista a ascendente | E2E | Cypress | PASS |
| **HU-10** | CP-10-E2E-03 | Estado vacío visual cuando el paciente no tiene tratamientos | E2E | Cypress | PASS |
| **HU-10** | CP-10-E2E-04 | Cambio entre pacientes limpia y no mezcla tratamientos | E2E | Cypress | PASS |
| **HU-11** | CP-11-01 | Registrar cobro con monto válido responde 200 y persiste monto | API | Vitest / Supertest | PASS |
| **HU-11** | CP-11-02 | Monto negativo en el cobro responde 400 | API | Vitest / Supertest | PASS |
| **HU-11** | CP-11-03 | Registrar cobro a cita inexistente responde 404 | Unitario | Vitest | PASS |
| **HU-11** | CP-11-04 | Fallo inesperado en servicio responde 500 | Unitario | Vitest | PASS |
| **HU-11** | CP-11-SCH-01 | registerPaymentSchema valida enteros y decimales positivos | Unitario | Vitest | PASS |
| **HU-11** | CP-11-SCH-02 | registerPaymentSchema permite monto cero | Unitario | Vitest | PASS |
| **HU-11** | CP-11-SCH-03 | registerPaymentSchema rechaza montos negativos | Unitario | Vitest | PASS |
| **HU-11** | CP-11-SCH-04 | registerPaymentSchema rechaza montos fuera de rango o infinito | Unitario | Vitest | PASS |
| **HU-11** | CP-11-E2E-01 | Botón de cobro visible únicamente en citas con estado ATENDIDA | E2E | Cypress | PASS |
| **HU-11** | CP-11-E2E-02 | Modal de cobro abre con datos del paciente y permite cancelar | E2E | Cypress | PASS |
| **HU-11** | CP-11-E2E-03 | Registro de cobro exitoso actualiza tarjeta mostrando Bs | E2E | Cypress | PASS |
| **HU-13** | CP-13-UT-01 | Normaliza número local boliviano de 8 dígitos añadiendo 591 | Unitario | Vitest | PASS |
| **HU-13** | CP-13-UT-02 | Respeta números que ya cuentan con prefijo 591 | Unitario | Vitest | PASS |
| **HU-13** | CP-13-UT-03 | Elimina prefijo internacional 00591 | Unitario | Vitest | PASS |
| **HU-13** | CP-13-UT-04 | Limpia espacios, guiones y caracteres no numéricos | Unitario | Vitest | PASS |
| **HU-13** | CP-13-UT-05 | Retorna null ante teléfonos de longitud inválida o texto | Unitario | Vitest | PASS |
| **HU-13** | CP-13-UT-06 | Genera enlace seguro https://wa.me/ con mensaje codificado | Unitario | Vitest | PASS |
| **HU-13** | CP-13-UT-07 | Manejo seguro de teléfono inválido retornando null | Unitario | Vitest | PASS |
| **HU-13** | CP-13-E2E-01 | Cita con teléfono muestra enlace wa.me con prefijo boliviano | E2E | Cypress | PASS |
| **HU-13** | CP-13-E2E-02 | Parámetro text incluye nombre, hora y motivo clínico | E2E | Cypress | PASS |
| **HU-13** | CP-13-E2E-03 | Paciente sin teléfono registrado no muestra botón de WhatsApp | E2E | Cypress | PASS |

---

## 2. Resumen de Ejecución
- **Total Casos Ejecutados:** 34 casos (unitarios, integración y E2E).
- **Aprobados:** 34 (100% de los casos implementados en verde).
- **Cobertura de Código Crítica:** Supera la meta SQAP del 80% en todas las ramas evaluadas (>97% de líneas).
