import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MedicalHistoryService,
  getAlertasCriticas,
} from '../../src/services/medical-history.service';

const mockPrisma = {
  patient: {
    findUnique: vi.fn(),
  },
  antecedenteMedico: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
} as any;

describe('QA Unit Tests: getAlertasCriticas y MedicalHistoryService (HU-03)', () => {
  describe('getAlertasCriticas', () => {
    it('paciente sin antecedentes no tiene alertas', () => {
      expect(getAlertasCriticas(null)).toEqual([]);
      expect(
        getAlertasCriticas({
          tiene_diabetes: false,
          tiene_hipertension: false,
          tiene_cardiopatia: false,
          toma_anticoagulantes: false,
          esta_embarazada: false,
          alergias: [],
        })
      ).toEqual([]);
    });

    it('las alergias aparecen primero por ser las mas criticas en el sillon', () => {
      const alertas = getAlertasCriticas({
        tiene_diabetes: true,
        tipo_diabetes: 'TIPO_2',
        tiene_hipertension: true,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: ['Penicilina'],
      });

      expect(alertas[0]).toBe('Alergia: Penicilina');
    });

    it('paciente con diabetes tipo 2 y anticoagulantes muestra ambas alertas', () => {
      const alertas = getAlertasCriticas({
        tiene_diabetes: true,
        tipo_diabetes: 'TIPO_2',
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: true,
        esta_embarazada: false,
        alergias: [],
      });

      expect(alertas).toEqual(['Anticoagulantes', 'Diabetes tipo 2']);
    });

    it('muestra cardiopatia, hipertension y embarazo cuando el paciente los tiene', () => {
      const alertas = getAlertasCriticas({
        tiene_diabetes: false,
        tiene_hipertension: true,
        tiene_cardiopatia: true,
        toma_anticoagulantes: false,
        esta_embarazada: true,
        alergias: [],
      });

      expect(alertas).toEqual(['Cardiopatía', 'Hipertensión', 'Embarazo']);
    });
  });

  describe('MedicalHistoryService', () => {
    let service: MedicalHistoryService;

    beforeEach(() => {
      vi.clearAllMocks();
      service = new MedicalHistoryService(mockPrisma);
    });

    it('getByPatientId devuelve los antecedentes con sus alertas si existen', async () => {
      const patientId = 'uuid-paciente-1';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });
      mockPrisma.antecedenteMedico.findUnique.mockResolvedValue({
        id: 'ant-1',
        patient_id: patientId,
        tiene_diabetes: false,
        tipo_diabetes: null,
        tiene_hipertension: true,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: ['Látex'],
        medicacion_actual: null,
        otras_condiciones: null,
      });

      const resultado = await service.getByPatientId(patientId);

      expect(resultado).not.toBeNull();
      expect(resultado?.alertas).toEqual(['Alergia: Látex', 'Hipertensión']);
    });

    it('getByPatientId devuelve null si el paciente no tiene antecedentes registrados', async () => {
      const patientId = 'uuid-paciente-2';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });
      mockPrisma.antecedenteMedico.findUnique.mockResolvedValue(null);

      const resultado = await service.getByPatientId(patientId);

      expect(resultado).toBeNull();
    });

    it('si el paciente no existe no llama a upsert', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      const payload = {
        tiene_diabetes: false,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: [],
      };

      await expect(service.upsertMedicalHistory('id-inexistente', payload)).rejects.toThrow(
        'Paciente no encontrado'
      );
      expect(mockPrisma.antecedenteMedico.upsert).not.toHaveBeenCalled();
    });

    it('el upsert usa el patient_id del paciente correcto', async () => {
      const patientId = 'uuid-paciente-a';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });
      mockPrisma.antecedenteMedico.upsert.mockResolvedValue({
        id: 'ant-1',
        patient_id: patientId,
        tiene_diabetes: false,
        tipo_diabetes: null,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: [],
        medicacion_actual: null,
        otras_condiciones: null,
      });

      const payload = {
        tiene_diabetes: false,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: [],
      };

      await service.upsertMedicalHistory(patientId, payload);

      expect(mockPrisma.antecedenteMedico.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patient_id: patientId },
          create: expect.objectContaining({ patient_id: patientId }),
        })
      );
    });
  });
});
