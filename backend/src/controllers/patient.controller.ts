import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service.js';
import { createPatientSchema } from '../schemas/patient.schema.js';
import { z } from 'zod';

const examValidationSchema = z.object({
  examenes_sangre_validados: z.boolean(),
  evidencia_archivo_nombre: z.string().nullable().optional(),
  evidencia_archivo_url: z.string().nullable().optional(),
  parametros_hematologicos: z.string().nullable().optional(),
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

  getAll = async (req: Request, res: Response) => {
    try {
      const { search, status, order } = (req.query || {}) as {
        search?: string;
        status?: string;
        order?: 'asc' | 'desc';
      };
      const patients = await this.service.getAllPatients({ search, status, order });
      return res.status(200).json(patients);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      return res.status(500).json({ error: errorMessage });
    }
  };

  updateExamStatus = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const parsed = examValidationSchema.parse(req.body);
      const updated = await this.service.setBloodExamValidation(
        id,
        parsed.examenes_sangre_validados,
        {
          evidencia_archivo_nombre: parsed.evidencia_archivo_nombre,
          evidencia_archivo_url: parsed.evidencia_archivo_url,
          parametros_hematologicos: parsed.parametros_hematologicos,
        }
      );
      return res.status(200).json(updated);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      const isNotFound = errorMessage === 'Paciente no encontrado';
      return res.status(isNotFound ? 404 : 400).json({ error: errorMessage });
    }
  };
}
