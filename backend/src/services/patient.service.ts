import { PrismaClient } from '@prisma/client';
import { CreatePatientInput } from '../schemas/patient.schema.js';

export class PatientService {
  constructor(private prisma: PrismaClient) {}

  async createPatient(data: CreatePatientInput) {
    return await this.prisma.patient.create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        edad: data.edad,
        examenes_sangre_validados: data.examenes_sangre_validados ?? false,
      },
    });
  }

  async getAllPatients(search?: string) {
    const normalizedSearch = search?.trim();

    return await this.prisma.patient.findMany({
      where: normalizedSearch
        ? {
            OR: [
              { nombre: { contains: normalizedSearch, mode: 'insensitive' } },
              { telefono: { contains: normalizedSearch } },
            ],
          }
        : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

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
