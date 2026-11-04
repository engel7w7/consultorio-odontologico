# Plan JMeter del Sprint 4

El archivo [sprint-4-jmeter.jmx](./sprint-4-jmeter.jmx) prueba el login y la consulta de agenda mediante HTTP.

Antes de ejecutar el plan, reemplaza en la petición `Login`:

- `TU_EMAIL_DE_PRUEBA`
- `TU_CONTRASEÑA_DE_PRUEBA`

Usa únicamente credenciales locales o de un entorno de pruebas. El token JWT se extrae automáticamente de la respuesta de login y se envía en las peticiones protegidas.

## Ejecución no gráfica

```powershell
jmeter -n -t .\sprint-4-jmeter.jmx -l .\resultados-sprint-4.jtl -e -o .\reporte-sprint-4
```

El plan base está configurado para ejecutar 10 usuarios con una rampa de 10 segundos y 10 iteraciones por usuario. Para la ejecución ampliada utiliza `plan-rendimiento-sprint4.jmx`.

La evidencia funcional ejecutada validó el login y la consulta de agenda con respuestas HTTP 200. Para reportar rendimiento cuantitativo, genera también el archivo `.jtl` y el reporte HTML; registra p95, porcentaje de error, throughput y total de samples en el informe QA del Sprint 4.

## Plan ampliado

Para una carga representativa del Sprint 4 usa [plan-rendimiento-sprint4.jmx](./plan-rendimiento-sprint4.jmx). Este plan ejecuta 25 usuarios, 20 iteraciones y prueba:

- `GET /api/recall/profilaxis-vencidas` (HU-14).
- `GET /api/recall/retorno-mensual?mes=2026-11` (HU-15).
- `GET /api/appointments?date=...` (agenda de soporte).

Ejecución recomendada:

```powershell
jmeter -n `
  -Jemail=TU_EMAIL_DE_PRUEBA `
  -Jpassword=TU_CONTRASEÑA_DE_PRUEBA `
  -t .\plan-rendimiento-sprint4.jmx `
  -l .\resultados-sprint4.jtl `
  -e -o .\reporte-sprint4
```
