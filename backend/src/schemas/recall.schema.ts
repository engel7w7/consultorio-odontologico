import { z } from 'zod';

export const profilaxisVencidaItemSchema = z.object({
  patient: z.object({
    id: z.string().uuid(),
    nombre: z.string(),
    telefono: z.string(),
  }),
  ultima_profilaxis: z.coerce.date(),
  fecha_vencimiento: z.coerce.date(),
  dias_atraso: z.number().int().nonnegative(),
  reagendado: z.boolean(),
  proxima_cita: z.coerce.date().nullable(),
});

export const profilaxisVencidasResponseSchema = z.array(profilaxisVencidaItemSchema);

export type ProfilaxisVencidaItemOutput = z.infer<typeof profilaxisVencidaItemSchema>;
export type ProfilaxisVencidasResponse = z.infer<typeof profilaxisVencidasResponseSchema>;

// HU-15: Esquemas para la lista mensual de retorno
export const retornoMensualQuerySchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'El formato de mes debe ser YYYY-MM')
    .optional(),
});

export type RetornoMensualQuery = z.infer<typeof retornoMensualQuerySchema>;

export const pacienteRetornoItemSchema = z.object({
  patient: z.object({
    id: z.string().uuid(),
    nombre: z.string(),
    telefono: z.string(),
  }),
  ultima_profilaxis: z.coerce.date(),
  fecha_vencimiento: z.coerce.date(),
  estado: z.enum(['VENCE_ESTE_MES', 'ATRASADO']),
  prioridad: z.number().int().min(0).max(100),
  motivos: z.array(z.string()),
  ingreso_estimado: z.number().nonnegative(),
});

export const retornoMensualResponseSchema = z.object({
  mes: z.string(),
  total: z.number().int().nonnegative(),
  ingreso_estimado_total: z.number().nonnegative(),
  pacientes: z.array(pacienteRetornoItemSchema),
});

export type PacienteRetornoItemOutput = z.infer<typeof pacienteRetornoItemSchema>;
export type RetornoMensualResponse = z.infer<typeof retornoMensualResponseSchema>;
