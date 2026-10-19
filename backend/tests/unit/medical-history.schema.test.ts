import { describe, it, expect } from 'vitest';
import { upsertMedicalHistorySchema } from '../../src/schemas/medical-history.schema.js';

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
      motivo: 'Actualización médica semestral del paciente',
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
      motivo: 'Registro de alergias identificadas en consulta',
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.alergias).toEqual(['Penicilina']);
    }
  });

  it('rechaza si no se proporciona motivo', () => {
    const resultado = upsertMedicalHistorySchema.safeParse({
      tiene_diabetes: false,
      tiene_hipertension: false,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: [],
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const issue = resultado.error.issues.find((i) => i.path.includes('motivo'));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe('El motivo de la modificación es obligatorio');
    }
  });

  it('rechaza si el motivo tiene menos de 10 caracteres', () => {
    const resultado = upsertMedicalHistorySchema.safeParse({
      tiene_diabetes: false,
      tiene_hipertension: false,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: [],
      motivo: 'Cambio', // 6 caracteres (< 10)
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const issue = resultado.error.issues.find((i) => i.path.includes('motivo'));
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('al menos 10 caracteres');
    }
  });

  it('acepta motivo con 10 o mas caracteres', () => {
    const resultado = upsertMedicalHistorySchema.safeParse({
      tiene_diabetes: false,
      tiene_hipertension: false,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: [],
      motivo: 'Motivo clínico detallado con más de diez caracteres',
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.motivo).toBe('Motivo clínico detallado con más de diez caracteres');
    }
  });

  it('admite payload empaquetado { cambios, motivo }', () => {
    const resultado = upsertMedicalHistorySchema.safeParse({
      cambios: {
        tiene_diabetes: false,
        tiene_hipertension: true,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: ['Látex'],
      },
      motivo: 'Actualización remitida por médico cardiólogo',
      usuario_id: 'Dra. Dental',
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.tiene_hipertension).toBe(true);
      expect(resultado.data.alergias).toEqual(['Látex']);
      expect(resultado.data.motivo).toBe('Actualización remitida por médico cardiólogo');
      expect(resultado.data.usuario_id).toBe('Dra. Dental');
    }
  });
});
