import { Request, Response } from 'express';
import { z } from 'zod';
import { RecallService, RecallError } from '../services/recall.service.js';
import { retornoMensualQuerySchema } from '../schemas/recall.schema.js';

export class RecallController {
  constructor(private service: RecallService) {}

  getProfilaxisVencidas = async (_req: Request, res: Response) => {
    try {
      const list = await this.service.getProfilaxisVencidas();
      return res.status(200).json(list);
    } catch (error: unknown) {
      if (error instanceof RecallError) {
        return res.status(400).json({ error: error.message, code: error.code });
      }

      console.error('Error en RecallController.getProfilaxisVencidas:', error);
      return res
        .status(500)
        .json({ error: 'Error interno al consultar las profilaxis vencidas' });
    }
  };

  getRetornoMensual = async (req: Request, res: Response) => {
    try {
      const { mes } = retornoMensualQuerySchema.parse(req.query);
      const resultado = await this.service.getRetornoMensual(mes);
      return res.status(200).json(resultado);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Parámetro de mes inválido (formato esperado: YYYY-MM)',
          issues: error.issues,
        });
      }

      if (error instanceof RecallError) {
        return res.status(400).json({ error: error.message, code: error.code });
      }

      console.error('Error en RecallController.getRetornoMensual:', error);
      return res
        .status(500)
        .json({ error: 'Error interno al consultar la lista mensual de retorno' });
    }
  };
}
