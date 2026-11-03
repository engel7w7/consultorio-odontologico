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
