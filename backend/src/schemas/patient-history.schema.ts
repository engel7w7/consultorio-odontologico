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
