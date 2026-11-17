# Informe de Consolidación - Sprint 5

**Proyecto:** Sistema de Gestión para Consultorio Odontológico  
**Fecha de consolidación:** 17 de noviembre de 2026  
**Rama:** `fix/auditoria-sqap`

## Alcance

Este sprint consolidó las acciones correctivas y preventivas (CAPA) identificadas
en las auditorías de calidad de los Sprints 1 al 4 y dejó evidencia operativa
para la entrega actual.

## Acciones CAPA ejecutadas

### Seguimiento de defectos

- Se registraron y enlazaron los Issues de GitHub correspondientes a los defectos
  documentados, desde `#65` hasta `#91`.
- Los defectos resueltos incluyen la referencia al commit de corrección y fueron
  cerrados en GitHub cuando la evidencia documental lo indicó.
- Las tablas `REGISTRO_DEFECTOS_*.md` fueron actualizadas con el enlace al Issue
  real de cada defecto.

### Análisis de calidad

- Se incorporó `sonar-project.properties` con las fuentes, pruebas, exclusiones
  y reporte LCOV del backend.
- El workflow de CI incluye el análisis SonarQube condicionado a la existencia
  del secreto `SONAR_TOKEN`.
- El Quality Gate de SonarQube quedó en estado **Passed**, con evidencia
  disponible en `docs/calidad/evidencia_sonarqube.png`.

### Respaldo de base de datos

- Se implementó `scripts/backup-db.mjs` y el comando `npm run db:backup`.
- Se generó el respaldo PostgreSQL actual mediante Docker:
  `backups/consultorio-2026-11-17T17-35-23-865Z.sql`.
- Tamaño: `14384` bytes.
- SHA-256:
  `7ecc6a33b2200042bcd18f0b99bf2fb1bcaa3514818e43ba71178877ebcea575`.
- El procedimiento de generación, verificación y restauración está documentado
  en `docs/calidad/REGISTRO_RESPALDOS_BD.md`.

### Documentación de usuario

- Se creó `docs/calidad/MANUAL_USUARIO_ODONTOLOGICO.md` con los flujos
  operativos de HU-01 a HU-15.
- `README.md` incluye el enlace directo al manual para el odontólogo.

## Resultado

La consolidación deja centralizados los hallazgos, las acciones CAPA, el
análisis estático, el respaldo verificable de la base de datos y la guía de uso
del sistema. Las evidencias y registros asociados quedan versionados junto con
esta entrega.
