# Plan de rendimiento - Sprint 1

El plan [plan-rendimiento-sprint1.jmx](./plan-rendimiento-sprint1.jmx) cubre el login autenticado, el directorio de pacientes, la consulta de pacientes y la agenda diaria.

Configuración base:

- 25 usuarios concurrentes.
- 10 segundos de ramp-up.
- 20 iteraciones por usuario.
- Objetivo SQAP: p95 menor o igual a 2000 ms y errores menores al 1%.

Antes de ejecutar, proporciona credenciales de un usuario odontólogo de pruebas mediante propiedades de JMeter:

```powershell
jmeter -n `
  -Jemail=TU_EMAIL_DE_PRUEBA `
  -Jpassword=TU_CONTRASEÑA_DE_PRUEBA `
  -t .\plan-rendimiento-sprint1.jmx `
  -l .\resultados-sprint1.jtl `
  -e -o .\reporte-sprint1
```

El plan no contiene credenciales reales. Registra p95, porcentaje de error, throughput y total de muestras en la evidencia del sprint.
