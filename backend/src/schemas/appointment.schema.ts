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

export const updateAppointmentStatusSchema = z.object({
  estado: z.enum(['ATENDIDA', 'CANCELADA'], {
    message: 'El estado debe ser ATENDIDA o CANCELADA',
  }),
});

export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
