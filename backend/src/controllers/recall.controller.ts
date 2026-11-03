import { Request, Response } from 'express';
import { RecallService, RecallError } from '../services/recall.service.js';

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
}
