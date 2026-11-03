import { PrismaClient } from '@prisma/client';
import {
  evaluarProfilaxisVencidas,
  evaluarRetornoMensual,
  ProfilaxisVencidaItem,
  RetornoMensualResultado,
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
   * Obtiene la lista de pacientes con profilaxis vencida (hace 6 meses o más) (HU-14).
   * Realiza una única consulta eficiente a Prisma (sin problema de N+1).
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

  /**
   * Obtiene la lista mensual de pacientes sugeridos para retorno (HU-15).
   * Consulta agregada eficiente a Prisma sin N+1.
   */
  async getRetornoMensual(mes?: string, hoy: Date = new Date()): Promise<RetornoMensualResultado> {
    try {
      const citas = await this.prisma.appointment.findMany({
        where: {
          OR: [
            { estado: 'ATENDIDA' },
            {
              estado: 'PROGRAMADA',
              fecha_inicio: { gt: hoy },
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

      return evaluarRetornoMensual(citas as unknown as CitaParaRecall[], mes, hoy);
    } catch (error: unknown) {
      if (error instanceof RecallError) {
        throw error;
      }
      console.error('Error en RecallService al consultar retorno mensual:', error);
      throw new RecallError('Error al recuperar la lista de retorno mensual', 'RECALL_QUERY_ERROR');
    }
  }
}
