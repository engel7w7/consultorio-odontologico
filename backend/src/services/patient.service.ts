import { PrismaClient } from '@prisma/client';
import { CreatePatientInput } from '../schemas/patient.schema.js';

export interface PatientQueryOptions {
  search?: string;
  status?: string;
  order?: 'asc' | 'desc';
}

export interface BloodExamEvidenceInput {
  evidencia_archivo_nombre?: string | null;
  evidencia_archivo_url?: string | null;
  parametros_hematologicos?: string | null;
}

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

  async getAllPatients(options?: PatientQueryOptions) {
    const where: Record<string, unknown> = {};

    if (options?.search) {
      where.nombre = { contains: options.search, mode: 'insensitive' };
    }

    if (options?.status === 'validated') {
      where.examenes_sangre_validados = true;
    } else if (options?.status === 'pending') {
      where.examenes_sangre_validados = false;
    }

    const orderBy: Record<string, 'asc' | 'desc'> = options?.order === 'asc'
      ? { nombre: 'asc' }
      : options?.order === 'desc'
      ? { nombre: 'desc' }
      : { created_at: 'desc' };

    return await this.prisma.patient.findMany({
      where,
      orderBy,
    });
  }

  async setBloodExamValidation(
    patientId: string,
    validado: boolean,
    evidence?: BloodExamEvidenceInput
  ) {
    const existing = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existing) {
      throw new Error('Paciente no encontrado');
    }

    const data: Record<string, unknown> = {
      examenes_sangre_validados: validado,
      fecha_validacion_examenes: validado ? new Date() : null,
    };

    if (evidence?.evidencia_archivo_nombre !== undefined) {
      data.evidencia_archivo_nombre = evidence.evidencia_archivo_nombre;
    }
    if (evidence?.evidencia_archivo_url !== undefined) {
      data.evidencia_archivo_url = evidence.evidencia_archivo_url;
    }
    if (evidence?.parametros_hematologicos !== undefined) {
      data.parametros_hematologicos = evidence.parametros_hematologicos;
    }

    return await this.prisma.patient.update({
      where: { id: patientId },
      data,
    });
  }

  async getPatientById(patientId: string) {
    return await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
  }
}
