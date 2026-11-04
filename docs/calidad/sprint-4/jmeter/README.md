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

El plan está configurado para ejecutar 10 usuarios con una rampa de 10 segundos y 10 iteraciones por usuario.
