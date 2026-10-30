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

export const createAppointmentSchema = z
  .object({
    patient_id: z.string().uuid('El ID del paciente debe ser un UUID válido'),
    motivo: z.string().min(3, 'El motivo de la cita debe tener al menos 3 caracteres'),
    fecha_inicio: z.string().datetime({ message: 'La fecha de inicio debe tener formato ISO 8601' }),
    fecha_fin: z.string().datetime({ message: 'La fecha de fin debe tener formato ISO 8601' }),
    estado: z.enum(['PROGRAMADA', 'ATENDIDA', 'CANCELADA']).optional().default('PROGRAMADA'),
  })
  .refine((data) => new Date(data.fecha_inicio) < new Date(data.fecha_fin), {
    message: 'La hora de inicio debe ser anterior a la hora de fin',
    path: ['fecha_fin'],
  });

export type GetAppointmentsQuery = z.input<typeof getAppointmentsQuerySchema>;
export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  estado: z.enum(['ATENDIDA', 'CANCELADA'], {
    message: 'El estado debe ser ATENDIDA o CANCELADA',
  }),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export const registerPaymentSchema = z.object({
  monto_pagado: z.number().finite().min(0, 'El monto no puede ser negativo').max(99999999.99),
});

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
