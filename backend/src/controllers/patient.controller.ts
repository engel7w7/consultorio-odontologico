import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service.js';
import { z } from 'zod';

const examValidationSchema = z.object({
  examenes_sangre_validados: z.boolean(),
});

export class PatientController {
  constructor(private service: PatientService) {}

  updateExamStatus = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'ID de paciente requerido' });
      }
      const parsed = examValidationSchema.parse(req.body);
      const updated = await this.service.setBloodExamValidation(
        id,
        parsed.examenes_sangre_validados
      );
      return res.status(200).json(updated);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      const isNotFound = errorMessage === 'Paciente no encontrado';
      return res.status(isNotFound ? 404 : 400).json({ error: errorMessage });
    }
  };
}
