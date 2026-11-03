import { PrismaClient } from '@prisma/client';
import {
  evaluarProfilaxisVencidas,
  ProfilaxisVencidaItem,
  CitaParaRecall,
} from '../utils/recall.utils.js';

export class RecallError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'RecallError';
    this.code = code;
  }
}

export class RecallService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Obtiene la lista de pacientes con profilaxis vencida (hace 6 meses o más).
   * Realiza una única consulta eficiente a Prisma (sin problema de N+1)
   * trayendo las citas atendidas y las citas programadas futuras para evaluar re-agendamiento.
   */
  async getProfilaxisVencidas(fechaReferencia: Date = new Date()): Promise<ProfilaxisVencidaItem[]> {
    try {
      const citas = await this.prisma.appointment.findMany({
        where: {
          OR: [
            { estado: 'ATENDIDA' },
            {
              estado: 'PROGRAMADA',
              fecha_inicio: { gt: fechaReferencia },
            },
          ],
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
          fecha_inicio: 'desc',
        },
      });

      return evaluarProfilaxisVencidas(citas as unknown as CitaParaRecall[], fechaReferencia);
    } catch (error: unknown) {
      if (error instanceof RecallError) {
        throw error;
      }
      console.error('Error en RecallService al consultar citas de profilaxis:', error);
      throw new RecallError('Error al recuperar las citas de profilaxis', 'RECALL_QUERY_ERROR');
    }
  }
}
