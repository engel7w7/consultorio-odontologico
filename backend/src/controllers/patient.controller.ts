import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service.js';
import { createPatientSchema } from '../schemas/patient.schema.js';
import { z } from 'zod';

const examValidationSchema = z.object({
  examenes_sangre_validados: z.boolean(),
});

export class PatientController {
  constructor(private service: PatientService) {}

  createPatient = async (req: Request, res: Response) => {
    try {
      const parsed = createPatientSchema.parse(req.body);
      const newPatient = await this.service.createPatient(parsed);
      return res.status(201).json(newPatient);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación',
          issues: error.issues,
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar paciente';
      return res.status(400).json({ error: errorMessage });
    }
  };

  getAll = async (_req: Request, res: Response) => {
    try {
      const patients = await this.service.getAllPatients();
      return res.status(200).json(patients);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      return res.status(500).json({ error: errorMessage });
    }
  };

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
