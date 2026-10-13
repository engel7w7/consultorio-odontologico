import { z } from 'zod';

export const createPatientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().min(7, 'El teléfono debe tener un formato válido (mínimo 7 caracteres)'),
  edad: z.number().int().positive('La edad debe ser un número entero positivo'),
  examenes_sangre_validados: z.boolean().optional().default(false),
});

export type CreatePatientInput = z.input<typeof createPatientSchema>;
