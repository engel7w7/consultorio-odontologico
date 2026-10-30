import { Request, Response } from 'express';
import { PatientHistoryService, PatientHistoryError } from '../services/patient-history.service.js';
import {
  patientHistoryParamSchema,
  patientHistoryQuerySchema,
} from '../schemas/patient-history.schema.js';
import { z } from 'zod';

export class PatientHistoryController {
  constructor(private service: PatientHistoryService) {}

  getHistory = async (req: Request, res: Response) => {
    try {
      const { id } = patientHistoryParamSchema.parse(req.params);
      const { orden } = patientHistoryQuerySchema.parse(req.query || {});
      const history = await this.service.getHistory(id, orden);
      return res.status(200).json(history);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación en parámetros',
          issues: error.issues,
        });
      }

      if (error instanceof PatientHistoryError && error.code === 'PATIENT_NOT_FOUND') {
        return res.status(404).json({ error: error.message, code: error.code });
      }

      console.error('Error al consultar historial de tratamientos:', error);
      return res
        .status(500)
        .json({ error: 'Error interno al consultar el historial de tratamientos' });
    }
  };
}
