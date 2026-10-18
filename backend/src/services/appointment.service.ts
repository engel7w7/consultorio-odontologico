import { PrismaClient } from '@prisma/client';
import { getDayRangeUTC } from '../utils/date.utils.js';
import { CreateAppointmentInput } from '../schemas/appointment.schema.js';

export { getDayRangeUTC };

export class AppointmentService {
  constructor(private prisma: PrismaClient) {}

  async getDailyAppointments(dateStr?: string) {
    const { start, end } = getDayRangeUTC(dateStr);

    return await this.prisma.appointment.findMany({
      where: {
        fecha_inicio: {
          gte: start,
          lt: end,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha_inicio: 'asc',
      },
    });
  }

  async createAppointment(data: CreateAppointmentInput) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patient_id },
    });

    if (!patient) {
      const err = new Error('Paciente no encontrado');
      (err as any).code = 'PATIENT_NOT_FOUND';
      throw err;
    }

    if (new Date(data.fecha_inicio) >= new Date(data.fecha_fin)) {
      const err = new Error('La hora de inicio debe ser anterior a la hora de fin');
      (err as any).code = 'START_TIME_MUST_BE_BEFORE_END_TIME';
      throw err;
    }

    const isExtraction = /extracc|exodoncia|cirug|quir[uú]rg|muela|molar/i.test(data.motivo);

    if (isExtraction && !patient.examenes_sangre_validados) {
      const error = new Error(
        'ALERTA ROJA BLOQUEANTE: No se puede agendar una extracción dental para un paciente sin exámenes de sangre validados (Luz Verde Médica requerida).'
      );
      (error as any).code = 'EXTRACTION_BLOOD_EXAMS_REQUIRED';
      throw error;
    }

    return await this.prisma.appointment.create({
      data: {
        patient_id: data.patient_id,
        motivo: data.motivo,
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: new Date(data.fecha_fin),
        estado: data.estado || 'PROGRAMADA',
      },
      include: {
        patient: {
          select: {
            id: true,
            nombre: true,
            examenes_sangre_validados: true,
          },
        },
      },
    });
  }
}
