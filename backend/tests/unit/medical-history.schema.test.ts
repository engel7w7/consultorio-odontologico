import { describe, it, expect } from 'vitest';
import { upsertMedicalHistorySchema } from '../../src/schemas/medical-history.schema';

describe('QA Unit Tests: medical-history.schema (HU-03)', () => {
  it('rechaza si marca diabetes sin tipo', () => {
    const resultado = upsertMedicalHistorySchema.safeParse({
      tiene_diabetes: true,
      tipo_diabetes: null,
      tiene_hipertension: false,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: [],
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toContain('tipo de diabetes es requerido');
    }
  });

  it('no duplica alergias con distinta mayuscula', () => {
    const resultado = upsertMedicalHistorySchema.safeParse({
      tiene_diabetes: false,
      tiene_hipertension: false,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: ['Penicilina', 'penicilina'],
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.alergias).toEqual(['Penicilina']);
    }
  });
});
