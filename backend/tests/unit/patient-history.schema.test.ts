import { describe, it, expect } from 'vitest';
import {
  patientHistoryParamSchema,
  patientHistoryQuerySchema,
} from '../../src/schemas/patient-history.schema.js';

describe('QA Unit Tests: esquemas de historial de tratamientos (HU-10)', () => {
  it('acepta un UUID válido como id de paciente', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(patientHistoryParamSchema.parse({ id })).toEqual({ id });
  });

  it('rechaza un id que no es UUID', () => {
    expect(patientHistoryParamSchema.safeParse({ id: 'abc' }).success).toBe(false);
  });

  it('usa orden desc por defecto', () => {
    expect(patientHistoryQuerySchema.parse({})).toEqual({ orden: 'desc' });
  });

  it.each(['asc', 'desc'])('acepta orden "%s"', (orden) => {
    expect(patientHistoryQuerySchema.parse({ orden })).toEqual({ orden });
  });

  it.each(['ASC', 'fecha', ''])('rechaza orden inválido "%s"', (orden) => {
    expect(patientHistoryQuerySchema.safeParse({ orden }).success).toBe(false);
  });
});
