import { z } from 'zod';

export const tipoDiabetesEnum = z.enum(['TIPO_1', 'TIPO_2', 'GESTACIONAL', 'OTRO']);

export const patientIdParamSchema = z.object({
  id: z.string().uuid('ID de paciente debe ser un UUID válido'),
});

export const upsertMedicalHistorySchema = z
  .preprocess((raw: unknown) => {
    // Si viene empaquetado como { cambios: { ... }, motivo: '...' }
    if (raw && typeof raw === 'object' && 'cambios' in raw) {
      const obj = raw as Record<string, unknown>;
      const cambios = (obj.cambios && typeof obj.cambios === 'object' ? obj.cambios : {}) as Record<string, unknown>;
      return {
        ...cambios,
        motivo: obj.motivo,
        usuario_id: obj.usuario_id || obj.usuarioId,
      };
    }
    return raw;
  }, z.object({
    tiene_diabetes: z.boolean({ message: 'Debe especificar si tiene diabetes' }),
    tipo_diabetes: tipoDiabetesEnum.nullable().optional(),
    tiene_hipertension: z.boolean({ message: 'Debe especificar si tiene hipertensión' }),
    tiene_cardiopatia: z.boolean({ message: 'Debe especificar si tiene cardiopatía' }),
    toma_anticoagulantes: z.boolean({ message: 'Debe especificar si toma anticoagulantes' }),
    esta_embarazada: z.boolean({ message: 'Debe especificar si está embarazada' }),
    alergias: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'La alergia no puede estar vacía')
      )
      .default([])
      .transform((items) => {
        const seen = new Set<string>();
        const uniqueItems: string[] = [];
        for (const item of items) {
          const trimmed = item.trim();
          const lower = trimmed.toLowerCase();
          if (trimmed.length > 0 && !seen.has(lower)) {
            seen.add(lower);
            uniqueItems.push(trimmed);
          }
        }
        return uniqueItems;
      }),
    medicacion_actual: z.string().trim().nullable().optional(),
    otras_condiciones: z.string().trim().nullable().optional(),
    motivo: z
      .string({ message: 'El motivo de la modificación es obligatorio' })
      .trim()
      .min(10, 'El motivo de la modificación debe tener al menos 10 caracteres'),
    usuario_id: z.string().trim().nullable().optional(),
    usuarioId: z.string().trim().nullable().optional(),
  }))
  .refine(
    (data) => {
      if (data.tiene_diabetes) {
        return !!data.tipo_diabetes;
      }
      return !data.tipo_diabetes;
    },
    {
      message:
        'El tipo de diabetes es requerido si tiene diabetes y debe omitirse si no la tiene',
      path: ['tipo_diabetes'],
    }
  );

export type UpsertMedicalHistoryInput = z.infer<typeof upsertMedicalHistorySchema>;
