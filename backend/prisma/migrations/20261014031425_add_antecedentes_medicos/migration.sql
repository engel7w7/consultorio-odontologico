-- CreateEnum
CREATE TYPE "tipo_diabetes" AS ENUM ('TIPO_1', 'TIPO_2', 'GESTACIONAL', 'OTRO');

-- CreateTable
CREATE TABLE "antecedentes_medicos" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "tiene_diabetes" BOOLEAN NOT NULL DEFAULT false,
    "tipo_diabetes" "tipo_diabetes",
    "tiene_hipertension" BOOLEAN NOT NULL DEFAULT false,
    "tiene_cardiopatia" BOOLEAN NOT NULL DEFAULT false,
    "toma_anticoagulantes" BOOLEAN NOT NULL DEFAULT false,
    "esta_embarazada" BOOLEAN NOT NULL DEFAULT false,
    "alergias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medicacion_actual" TEXT,
    "otras_condiciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "antecedentes_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "antecedentes_medicos_patient_id_key" ON "antecedentes_medicos"("patient_id");

-- AddForeignKey
ALTER TABLE "antecedentes_medicos" ADD CONSTRAINT "antecedentes_medicos_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
