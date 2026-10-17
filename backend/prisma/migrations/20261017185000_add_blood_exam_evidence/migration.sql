-- AlterTable
ALTER TABLE "patients" ADD COLUMN "evidencia_archivo_nombre" VARCHAR(255),
ADD COLUMN "evidencia_archivo_url" TEXT,
ADD COLUMN "parametros_hematologicos" TEXT,
ADD COLUMN "fecha_validacion_examenes" TIMESTAMP(3);
