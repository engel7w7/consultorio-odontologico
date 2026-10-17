import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MedicalHistoryService,
  getAlertasCriticas,
} from '../../src/services/medical-history.service';

const mockTx = {
  antecedenteMedico: {
    upsert: vi.fn(),
  },
  medicalHistoryAudit: {
    createMany: vi.fn(),
  },
};

const mockPrisma = {
  patient: {
    findUnique: vi.fn(),
  },
  antecedenteMedico: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  medicalHistoryAudit: {
    findMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (callback: any) => {
    if (typeof callback === 'function') {
      return callback(mockTx);
    }
    return callback;
  }),
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
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        if (typeof callback === 'function') {
          return callback(mockTx);
        }
        return callback;
      });
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

    it('si el paciente no existe no llama a upsert ni a auditoria', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      const payload = {
        tiene_diabetes: false,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: [],
        motivo: 'Motivo de modificación válido',
      };

      await expect(service.upsertMedicalHistory('id-inexistente', payload)).rejects.toThrow(
        'Paciente no encontrado'
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockTx.antecedenteMedico.upsert).not.toHaveBeenCalled();
    });

    it('sin motivo da error y no guarda ni audita', async () => {
      const patientId = 'uuid-paciente-sin-motivo';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });

      const payloadSinMotivo: any = {
        tiene_diabetes: false,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: [],
      };

      await expect(service.upsertMedicalHistory(patientId, payloadSinMotivo)).rejects.toThrow(
        'El motivo de la modificación es obligatorio y debe tener al menos 10 caracteres'
      );

      const payloadMotivoCorto: any = {
        ...payloadSinMotivo,
        motivo: 'Corto',
      };

      await expect(service.upsertMedicalHistory(patientId, payloadMotivoCorto)).rejects.toThrow(
        'El motivo de la modificación es obligatorio y debe tener al menos 10 caracteres'
      );

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('guardar con motivo crea auditoría en una transacción', async () => {
      const patientId = 'uuid-paciente-audit';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });
      // Antecedente previo
      mockPrisma.antecedenteMedico.findUnique.mockResolvedValue({
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

      const updatedRecord = {
        id: 'ant-1',
        patient_id: patientId,
        tiene_diabetes: true,
        tipo_diabetes: 'TIPO_2',
        tiene_hipertension: true,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: ['Penicilina'],
        medicacion_actual: 'Metformina',
        otras_condiciones: null,
      };

      mockTx.antecedenteMedico.upsert.mockResolvedValue(updatedRecord);
      mockTx.medicalHistoryAudit.createMany.mockResolvedValue({ count: 4 });

      const payload = {
        tiene_diabetes: true,
        tipo_diabetes: 'TIPO_2' as const,
        tiene_hipertension: true,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: ['Penicilina'],
        medicacion_actual: 'Metformina',
        motivo: 'Diagnóstico reciente informado por el paciente',
        usuario_id: 'Dr. López',
      };

      const resultado = await service.upsertMedicalHistory(patientId, payload);

      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
      expect(mockTx.antecedenteMedico.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patient_id: patientId },
          create: expect.objectContaining({
            patient_id: patientId,
            tiene_diabetes: true,
            tipo_diabetes: 'TIPO_2',
          }),
        })
      );

      expect(mockTx.medicalHistoryAudit.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            patient_id: patientId,
            campo: 'tiene_diabetes',
            valor_anterior: 'No',
            valor_nuevo: 'Sí',
            motivo: 'Diagnóstico reciente informado por el paciente',
            usuario_id: 'Dr. López',
          }),
          expect.objectContaining({
            patient_id: patientId,
            campo: 'alergias',
            valor_anterior: 'Ninguna',
            valor_nuevo: 'Penicilina',
          }),
        ]),
      });

      expect(resultado.alertas).toEqual(['Alergia: Penicilina', 'Diabetes tipo 2', 'Hipertensión']);
    });

    it('sin cambios no audita ni llama a transacción', async () => {
      const patientId = 'uuid-paciente-sin-cambios';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });

      const existingRecord = {
        id: 'ant-existente',
        patient_id: patientId,
        tiene_diabetes: false,
        tipo_diabetes: null,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: ['Látex'],
        medicacion_actual: 'Paracetamol',
        otras_condiciones: null,
      };

      mockPrisma.antecedenteMedico.findUnique.mockResolvedValue(existingRecord);

      const payloadIdentico = {
        tiene_diabetes: false,
        tipo_diabetes: null,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: ['Látex'],
        medicacion_actual: 'Paracetamol',
        otras_condiciones: null,
        motivo: 'Revisión sin modificaciones de ningún campo clínico',
      };

      const resultado = await service.upsertMedicalHistory(patientId, payloadIdentico);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockTx.antecedenteMedico.upsert).not.toHaveBeenCalled();
      expect(mockTx.medicalHistoryAudit.createMany).not.toHaveBeenCalled();
      expect(resultado.id).toBe('ant-existente');
      expect(resultado.alertas).toEqual(['Alergia: Látex']);
    });

    it('si falla la auditoría, la transacción falla y el antecedente no cambia', async () => {
      const patientId = 'uuid-paciente-fallo-tx';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });
      mockPrisma.antecedenteMedico.findUnique.mockResolvedValue({
        id: 'ant-orig',
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

      // Simular que createMany en la auditoría falla dentro de la transacción
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // En una transacción real, si alguna promesa es rechazada, se aborta
        await callback({
          antecedenteMedico: {
            upsert: vi.fn().mockResolvedValue({ id: 'ant-modificado' }),
          },
          medicalHistoryAudit: {
            createMany: vi.fn().mockRejectedValue(new Error('Fallo crítico al insertar fila de auditoría')),
          },
        });
      });

      const payload = {
        tiene_diabetes: true,
        tipo_diabetes: 'TIPO_1' as const,
        tiene_hipertension: false,
        tiene_cardiopatia: false,
        toma_anticoagulantes: false,
        esta_embarazada: false,
        alergias: [],
        motivo: 'Modificación con fallo en auditoría',
      };

      await expect(service.upsertMedicalHistory(patientId, payload)).rejects.toThrow(
        'Fallo crítico al insertar fila de auditoría'
      );
    });

    it('getAuditHistory devuelve lista de auditoria del paciente ordenada de más reciente a más antigua', async () => {
      const patientId = 'uuid-paciente-audit-list';
      mockPrisma.patient.findUnique.mockResolvedValue({ id: patientId });

      const auditRows = [
        {
          id: 'aud-2',
          patient_id: patientId,
          campo: 'tiene_hipertension',
          valor_anterior: 'No',
          valor_nuevo: 'Sí',
          motivo: 'Paciente diagnosticado con HTA grado 1',
          usuario_id: 'Dr. Test',
          fecha_hora: new Date('2026-10-17T15:00:00Z'),
        },
        {
          id: 'aud-1',
          patient_id: patientId,
          campo: 'alergias',
          valor_anterior: null,
          valor_nuevo: 'Penicilina',
          motivo: 'Apertura de ficha clínica inicial',
          usuario_id: 'Dr. Test',
          fecha_hora: new Date('2026-10-15T10:00:00Z'),
        },
      ];

      mockPrisma.medicalHistoryAudit.findMany.mockResolvedValue(auditRows);

      const res = await service.getAuditHistory(patientId);

      expect(mockPrisma.medicalHistoryAudit.findMany).toHaveBeenCalledWith({
        where: { patient_id: patientId },
        orderBy: { fecha_hora: 'desc' },
      });
      expect(res).toHaveLength(2);
      expect(res[0].id).toBe('aud-2');
      expect(res[0].patientId).toBe(patientId);
      expect(res[0].campo).toBe('tiene_hipertension');
    });

    it('getAuditHistory lanza error 404 si el paciente no existe', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      await expect(service.getAuditHistory('uuid-no-existe')).rejects.toThrow(
        'Paciente no encontrado'
      );
      expect(mockPrisma.medicalHistoryAudit.findMany).not.toHaveBeenCalled();
    });
  });
});
