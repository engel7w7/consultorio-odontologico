import { PrismaClient } from '@prisma/client';

export class PatientService {
  constructor(private prisma: PrismaClient) {}

  async setBloodExamValidation(patientId: string, validado: boolean) {
    const existing = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existing) {
      throw new Error('Paciente no encontrado');
    }

    return await this.prisma.patient.update({
      where: { id: patientId },
      data: { examenes_sangre_validados: validado },
    });
  }

  async getPatientById(patientId: string) {
    return await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
  }
}
