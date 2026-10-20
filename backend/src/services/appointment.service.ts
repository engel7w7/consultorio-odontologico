import { PrismaClient } from '@prisma/client';
import { getDayRangeUTC } from '../utils/date.utils.js';

export { getDayRangeUTC };

export class AppointmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Obtiene las citas del día especificado (o del día actual en America/La_Paz si no se especifica),
   * ordenadas cronológicamente por fecha_inicio ascendente.
   * Incluye los datos del paciente (únicamente id y nombre).
   */
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
          },
        },
      },
    });
  }
}
