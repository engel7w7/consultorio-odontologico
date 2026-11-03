import { z } from 'zod';

export const patientHistoryParamSchema = z.object({
  id: z.string().uuid('ID de paciente debe ser un UUID válido'),
});

export const patientHistoryQuerySchema = z.object({
  orden: z
    .enum(['asc', 'desc'], { message: 'El orden debe ser "asc" o "desc"' })
    .default('desc'),
});

export type PatientHistoryQuery = z.infer<typeof patientHistoryQuerySchema>;
export type OrdenHistorial = PatientHistoryQuery['orden'];

export const createTreatmentSchema = z.object({
  nomenclatura_rapida: z
    .string()
    .min(1, 'La nomenclatura o descripción del tratamiento es requerida')
    .max(200, 'La descripción no puede exceder 200 caracteres'),
  fecha: z.string().datetime({ message: 'La fecha debe tener formato ISO 8601' }).optional(),
  duracion_minutos: z.number().int().positive('La duración debe ser un número entero positivo').optional(),
  observaciones: z.string().max(500, 'Las observaciones no pueden exceder 500 caracteres').optional(),
});

export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
