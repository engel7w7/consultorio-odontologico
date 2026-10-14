import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalHistoryController } from '../../src/controllers/medical-history.controller';
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

  describe('upsertMedicalHistory', () => {
    const patientId = '123e4567-e89b-12d3-a456-426614174000';
    const validPayload = {
      tiene_diabetes: false,
      tiene_hipertension: true,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: [],
    };

    it('responde 200 al guardar antecedentes con datos validos', async () => {
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
      expect(mockService.upsertMedicalHistory).toHaveBeenCalledWith(patientId, validPayload);
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
