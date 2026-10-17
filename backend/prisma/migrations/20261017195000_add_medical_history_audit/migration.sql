-- CreateTable
CREATE TABLE "medical_history_audits" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "campo" VARCHAR(100) NOT NULL,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "motivo" TEXT NOT NULL,
    "usuario_id" VARCHAR(100),
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_history_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_history_audits_patient_id_idx" ON "medical_history_audits"("patient_id");

-- AddForeignKey
ALTER TABLE "medical_history_audits" ADD CONSTRAINT "medical_history_audits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
