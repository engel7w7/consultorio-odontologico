import { Request, Response } from 'express';
import { MedicalHistoryService } from '../services/medical-history.service.js';
import {
  patientIdParamSchema,
  upsertMedicalHistorySchema,
} from '../schemas/medical-history.schema.js';
import { z } from 'zod';

export class MedicalHistoryController {
  constructor(private service: MedicalHistoryService) {}

  getMedicalHistory = async (req: Request, res: Response) => {
    try {
      const { id } = patientIdParamSchema.parse(req.params);
      const history = await this.service.getByPatientId(id);
      return res.status(200).json(history);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación en parámetros',
          issues: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Paciente no encontrado') {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      console.error('Error al consultar antecedentes médicos:', error);
      return res
        .status(500)
        .json({ error: 'Error interno al consultar los antecedentes médicos' });
    }
  };

  upsertMedicalHistory = async (req: Request, res: Response) => {
    try {
      const { id } = patientIdParamSchema.parse(req.params);
      const parsedBody = upsertMedicalHistorySchema.parse(req.body);
      const saved = await this.service.upsertMedicalHistory(id, parsedBody);
      return res.status(200).json(saved);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación en los datos',
          issues: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Paciente no encontrado') {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      console.error('Error al registrar antecedentes médicos:', error);
      return res
        .status(500)
        .json({ error: 'Error interno al registrar los antecedentes médicos' });
    }
  };
}
