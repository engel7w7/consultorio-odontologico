import { PrismaClient } from '@prisma/client';
import { getDayRangeUTC } from '../utils/date.utils.js';
import { CreateAppointmentInput } from '../schemas/appointment.schema.js';

export { getDayRangeUTC };

export class AppointmentError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AppointmentError';
    this.code = code;
  }
}

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
            telefono: true,
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
      throw new AppointmentError('Paciente no encontrado', 'PATIENT_NOT_FOUND');
    }

    if (new Date(data.fecha_inicio) >= new Date(data.fecha_fin)) {
      throw new AppointmentError(
        'La hora de inicio debe ser anterior a la hora de fin',
        'START_TIME_MUST_BE_BEFORE_END_TIME'
      );
    }

    const isExtraction = /extracc|exodoncia|cirug|quir[uú]rg|muela|molar/i.test(data.motivo);

    if (isExtraction && !patient.examenes_sangre_validados) {
      throw new AppointmentError(
        'ALERTA ROJA BLOQUEANTE: No se puede agendar una extracción dental para un paciente sin exámenes de sangre validados (Luz Verde Médica requerida).',
        'EXTRACTION_BLOOD_EXAMS_REQUIRED'
      );
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
            telefono: true,
            examenes_sangre_validados: true,
          },
        },
      },
    });
  }

  async updateAppointmentStatus(appointmentId: string, estado: 'ATENDIDA' | 'CANCELADA') {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    return await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { estado },
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

  async registerPayment(appointmentId: string, montoPagado: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    if (appointment.estado !== 'ATENDIDA') {
      throw new Error('Solo se pueden registrar cobros en citas atendidas');
    }

    if (appointment.monto_pagado != null) {
      throw new Error('El cobro de la cita ya fue registrado');
    }

    return await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { monto_pagado: montoPagado },
      include: {
        patient: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            examenes_sangre_validados: true,
          },
        },
      },
    });
  }
}
