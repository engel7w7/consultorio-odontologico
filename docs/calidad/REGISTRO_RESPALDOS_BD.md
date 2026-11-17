# Registro de respaldos de base de datos

Proyecto: Sistema de Gestión Odontológica  
Motor: PostgreSQL 15  
Esquema: `backend/prisma/schema.prisma`

## Entregas

| Entrega | Fecha | Archivo | Tamaño (bytes) | SHA-256 | Estado |
| :--- | :--- | :--- | ---: | :--- | :--- |
| E1 | N/D | N/D | N/D | N/D | No existe respaldo verificable en el repositorio |
| E2 | N/D | N/D | N/D | N/D | No existe respaldo verificable en el repositorio |
| E3 | N/D | N/D | N/D | N/D | No existe respaldo verificable en el repositorio |
| E4 | N/D | N/D | N/D | N/D | No existe respaldo verificable en el repositorio |
| E5 | 17 de noviembre de 2026 | `backups/consultorio-2026-11-17T17-35-23-865Z.sql` | 14384 | `7ecc6a33b2200042bcd18f0b99bf2fb1bcaa3514818e43ba71178877ebcea575` | Respaldo generado desde PostgreSQL mediante Docker |

E1–E4 se dejan explícitamente como no disponibles porque no hay archivos de respaldo,
metadatos ni checksums históricos versionados. No se inventan fechas, tamaños ni hashes.
El registro E5 corresponde al respaldo generado el 17 de noviembre de 2026.

## Procedimiento de generación

Desde la raíz del proyecto:

```powershell
cd backend
npm run db:backup
```

El script:

1. Obtiene `DATABASE_URL` del entorno o de `backend/.env`.
2. Ejecuta `pg_dump` con formato SQL plano, sin propietario ni privilegios.
3. Si `pg_dump` no existe en Windows, usa `docker compose exec -T postgres-test pg_dump`
   contra el servicio definido en `docker-compose.yml`.
4. Guarda el archivo en `backups/`.
5. Calcula y muestra el hash SHA-256 y el tamaño en bytes.

## Procedimiento de restauración

La restauración debe hacerse sobre una base de datos vacía o previamente respaldada.
Para el PostgreSQL local de Docker:

```powershell
Get-Content .\backups\consultorio-<timestamp>.sql |
  docker compose exec -T postgres-test psql -U test_user -d consultorio_test_db
```

Para otra instancia, sustituir usuario, base de datos y servicio por los valores
correspondientes. Después de restaurar, ejecutar las migraciones Prisma pendientes:

```powershell
cd backend
npx prisma migrate deploy
```

Verificar el checksum antes de restaurar:

```powershell
Get-FileHash .\backups\consultorio-<timestamp>.sql -Algorithm SHA256
```
