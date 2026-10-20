import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalHistoryController } from '../../src/controllers/medical-history.controller.js';
import { Request, Response } from 'express';

describe('QA Unit Tests: MedicalHistoryController (HU-03)', () => {
  let controller: MedicalHistoryController;
  let mockService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = {
      getByPatientId: vi.fn(),
      getAuditHistory: vi.fn(),
      upsertMedicalHistory: vi.fn(),
    };
    controller = new MedicalHistoryController(mockService);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('getMedicalHistory', () => {
    const patientId = '123e4567-e89b-12d3-a456-426614174000';

    it('responde 200 con el historial si el paciente existe', async () => {
      mockReq = { params: { id: patientId } };
      const mockHistorial = {
        id: 'ant-1',
        patient_id: patientId,
        tiene_diabetes: false,
        alertas: ['Hipertensión'],
      };
      mockService.getByPatientId.mockResolvedValue(mockHistorial);

      await controller.getMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockHistorial);
    });

    it('responde 400 si el id no es un uuid valido', async () => {
      mockReq = { params: { id: 'no-uuid' } };

      await controller.getMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ID de paciente debe ser un UUID válido',
        })
      );
    });

    it('responde 404 si el paciente no existe', async () => {
      mockReq = { params: { id: patientId } };
      mockService.getByPatientId.mockRejectedValue(new Error('Paciente no encontrado'));

      await controller.getMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Paciente no encontrado' });
    });

    it('responde 500 generico sin mostrar el error interno ante fallo de base de datos', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReq = { params: { id: patientId } };
      mockService.getByPatientId.mockRejectedValue(new Error('Fallo interno de conexion a la base de datos'));

      await controller.getMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno al consultar los antecedentes médicos',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getAuditHistory', () => {
    const patientId = '123e4567-e89b-12d3-a456-426614174000';

    it('responde 200 con la lista de auditoria del paciente', async () => {
      mockReq = { params: { id: patientId } };
      const mockAudit = [
        {
          id: 'aud-1',
          patient_id: patientId,
          campo: 'alergias',
          valor_anterior: 'Ninguna',
          valor_nuevo: 'Penicilina',
          motivo: 'Paciente refirió reacción alérgica reciente',
          usuario_id: 'Dr. Test',
          fecha_hora: new Date().toISOString(),
        },
      ];
      mockService.getAuditHistory.mockResolvedValue(mockAudit);

      await controller.getAuditHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockAudit);
    });

    it('responde 400 si el id en getAuditHistory no es un uuid valido', async () => {
      mockReq = { params: { id: 'invalid-id' } };

      await controller.getAuditHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ID de paciente debe ser un UUID válido',
        })
      );
    });

    it('responde 404 si el paciente no existe en getAuditHistory', async () => {
      mockReq = { params: { id: patientId } };
      mockService.getAuditHistory.mockRejectedValue(new Error('Paciente no encontrado'));

      await controller.getAuditHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Paciente no encontrado' });
    });

    it('responde 500 generico ante fallo en getAuditHistory', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReq = { params: { id: patientId } };
      mockService.getAuditHistory.mockRejectedValue(new Error('Error en consulta SQL'));

      await controller.getAuditHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno al consultar la auditoría de antecedentes médicos',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('upsertMedicalHistory', () => {
    const patientId = '123e4567-e89b-12d3-a456-426614174000';
    const validPayload = {
      tiene_diabetes: false,
      tiene_hipertension: true,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: [],
      motivo: 'Control médico previo a intervención dental',
    };

    it('responde 200 al guardar antecedentes con datos validos y motivo', async () => {
      mockReq = {
        params: { id: patientId },
        body: validPayload,
      };
      const mockGuardado = {
        id: 'ant-1',
        patient_id: patientId,
        ...validPayload,
        alertas: ['Hipertensión'],
      };
      mockService.upsertMedicalHistory.mockResolvedValue(mockGuardado);

      await controller.upsertMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockGuardado);
      expect(mockService.upsertMedicalHistory).toHaveBeenCalledWith(
        patientId,
        expect.objectContaining({
          tiene_hipertension: true,
          motivo: 'Control médico previo a intervención dental',
        })
      );
    });

    it('responde 400 si falta el motivo o es menor a 10 caracteres', async () => {
      mockReq = {
        params: { id: patientId },
        body: {
          ...validPayload,
          motivo: 'Corto',
        },
      };

      await controller.upsertMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('al menos 10 caracteres'),
        })
      );
      expect(mockService.upsertMedicalHistory).not.toHaveBeenCalled();
    });

    it('responde 400 si el body tiene datos invalidos', async () => {
      mockReq = {
        params: { id: patientId },
        body: {
          tiene_diabetes: true,
          // Falta tipo_diabetes obligatorio
          tiene_hipertension: false,
          tiene_cardiopatia: false,
          toma_anticoagulantes: false,
          esta_embarazada: false,
          alergias: [],
          motivo: 'Control médico previo a intervención dental',
        },
      };

      await controller.upsertMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'El tipo de diabetes es requerido si tiene diabetes y debe omitirse si no la tiene',
          issues: expect.any(Array),
        })
      );
      expect(mockService.upsertMedicalHistory).not.toHaveBeenCalled();
    });

    it('responde 404 si el paciente no existe al guardar', async () => {
      mockReq = {
        params: { id: patientId },
        body: validPayload,
      };
      mockService.upsertMedicalHistory.mockRejectedValue(new Error('Paciente no encontrado'));

      await controller.upsertMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Paciente no encontrado' });
    });

    it('responde 500 generico si la base de datos falla al guardar', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReq = {
        params: { id: patientId },
        body: validPayload,
      };
      mockService.upsertMedicalHistory.mockRejectedValue(new Error('Fallo de conexión a la base de datos'));

      await controller.upsertMedicalHistory(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno al registrar los antecedentes médicos',
      });

      consoleSpy.mockRestore();
    });
  });
});
