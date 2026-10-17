import { z } from 'zod';

export const getAppointmentsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD')
    .refine((val) => {
      const [year, month, day] = val.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      );
    }, 'Fecha inválida')
    .optional(),
});

export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid('El ID del paciente debe ser un UUID válido'),
  motivo: z.string().min(3, 'El motivo de la cita debe tener al menos 3 caracteres'),
  fecha_inicio: z.string().datetime({ message: 'La fecha de inicio debe tener formato ISO 8601' }),
  fecha_fin: z.string().datetime({ message: 'La fecha de fin debe tener formato ISO 8601' }),
  estado: z.enum(['PROGRAMADA', 'ATENDIDA', 'CANCELADA']).optional().default('PROGRAMADA'),
});

export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
