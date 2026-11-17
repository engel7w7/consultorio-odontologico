# Informe de Calidad - Sprint 4 - HU-14 y HU-15

**Proyecto:** Sistema de Gestión para Consultorio Odontológico  
**Historias evaluadas:** HU-14 (profilaxis vencida) y HU-15 (lista mensual de retorno)  
**Estándares:** ISO/IEC 25010, ISO/IEC 14598, IEEE 730 y SQAP  
**Fecha de actualización:** 4 de noviembre de 2026  
**Rama de evidencia:** `qa/sprint-4-e2e-fixes`

## 1. Alcance

Se verificaron las reglas de negocio, los servicios y controladores backend, la interfaz de retorno de pacientes y las pruebas E2E de Cypress. También se incorporó un plan JMeter para validar el login y la consulta autenticada de agenda.

## 2. Resultados de pruebas

| Nivel | HU-14 | HU-15 | Resultado |
|---|---:|---:|---|
| Unitario e integración | 302 aprobadas, 3 `expected fail` | 330 aprobadas, 4 `expected fail` | Conforme |
| Cobertura de statements | 98.01% | 98.04% | Conforme |
| Cobertura de branches | 88.35% | 88.75% | Conforme |
| Cobertura de functions | 97.72% | 97.19% | Conforme |
| Cobertura de lines | 98.21% | 98.21% | Conforme |
| Cypress E2E | 3/3 aprobadas | 4/4 aprobadas | Conforme |

Los casos `expected fail` pertenecen a escenarios marcados explícitamente por la suite y no representan fallos de los casos críticos de estas historias.

## 3. Evidencia funcional

### HU-14 - Profilaxis vencida

- Muestra pacientes cuya profilaxis tiene seis meses o más de antigüedad.
- Presenta los días de atraso.
- Identifica pacientes ya reagendados.
- Oculta la acción de agendar cuando el paciente ya tiene una cita.
- Permite abrir el modal y registrar una cita de profilaxis para pacientes no reagendados.

### HU-15 - Lista mensual de retorno

- Muestra el listado del mes seleccionado.
- Presenta cantidad de pacientes e ingreso estimado.
- Calcula y muestra la prioridad, estado y motivos.
- Genera el enlace de WhatsApp con el teléfono normalizado.
- Permite navegar al mes siguiente y actualizar los datos.
- No incluye pacientes ya reagendados.

## 4. Prueba de rendimiento con JMeter

Plan utilizado: [sprint-4-jmeter.jmx](./jmeter/sprint-4-jmeter.jmx)

Configuración:

- 10 usuarios concurrentes.
- Ramp-up de 10 segundos.
- 10 iteraciones por usuario.
- Login `POST /api/auth/login`.
- Extracción automática del JWT mediante JSON JMESPath Extractor.
- Consulta autenticada `GET /api/appointments?date=2026-11-03`.

La ejecución gráfica observada mostró las solicitudes `Login` y `Obtener agenda` en verde, con respuestas HTTP 200 y sin errores visibles en los samples ejecutados.

Para cerrar formalmente el criterio de rendimiento del SQAP todavía debe generarse el reporte no gráfico y registrar sus métricas:

```powershell
jmeter -n -t .\sprint-4-jmeter.jmx `
  -l .\resultados-sprint-4.jtl `
  -e -o .\reporte-sprint-4
```

Registrar del `Aggregate Report`:

- Percentil 95 (p95).
- Porcentaje de errores.
- Throughput.
- Total de samples.

No se incluyen credenciales reales en el plan publicado; deben reemplazarse los marcadores por credenciales de un entorno de pruebas.

## 5. Dictamen

**HU-14: APROBADA técnicamente.**  
**HU-15: APROBADA técnicamente.**

Las pruebas unitarias, de integración y E2E específicas están en verde. La evidencia JMeter confirma el flujo funcional autenticado, pero el cierre del criterio cuantitativo de rendimiento queda condicionado a adjuntar el reporte HTML con p95 y porcentaje de error.
