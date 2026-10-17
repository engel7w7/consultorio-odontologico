import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientController } from '../../src/controllers/patient.controller';
import { Request, Response } from 'express';

describe('QA Unit Tests: PatientController (Branch Coverage)', () => {
  let controller: PatientController;
  let mockService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = {
      createPatient: vi.fn(),
      getAllPatients: vi.fn(),
      setBloodExamValidation: vi.fn(),
      getPatientById: vi.fn(),
    };
    controller = new PatientController(mockService);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('createPatient', () => {
    it('debe registrar un paciente y responder 201', async () => {
      mockReq = {
        body: { nombre: 'María López', telefono: '78945612', edad: 29 },
      };
      mockService.createPatient.mockResolvedValue({ id: 'uuid-1', ...mockReq.body });

      await controller.createPatient(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'uuid-1' }));
    });

    it('debe manejar error genérico cuando el servicio falla con objeto no Error', async () => {
      mockReq = {
        body: { nombre: 'María López', telefono: '78945612', edad: 29 },
      };
      mockService.createPatient.mockRejectedValue('Error string inesperado');

      await controller.createPatient(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al registrar paciente' });
    });
  });

  describe('getAll', () => {
    it('debe responder 200 con la lista de pacientes', async () => {
      mockReq = {};
      mockService.getAllPatients.mockResolvedValue([{ id: 'uuid-1', nombre: 'Juan' }]);

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ id: 'uuid-1', nombre: 'Juan' }]);
    });

    it('debe responder 200 con la lista de pacientes filtrada por query', async () => {
      mockReq = {
        query: { search: 'Carlos', status: 'validated', order: 'asc' },
      };
      mockService.getAllPatients.mockResolvedValue([{ id: 'uuid-1', nombre: 'Carlos' }]);

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockService.getAllPatients).toHaveBeenCalledWith({
        search: 'Carlos',
        status: 'validated',
        order: 'asc',
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ id: 'uuid-1', nombre: 'Carlos' }]);
    });

    it('debe manejar error cuando getAllPatients falla con objeto no Error', async () => {
      mockReq = {};
      mockService.getAllPatients.mockRejectedValue('Error string');

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error inesperado' });
    });
  });

  describe('updateExamStatus', () => {
    it('debe actualizar los exámenes con evidencia y responder 200', async () => {
      mockReq = {
        params: { id: 'uuid-10' },
        body: {
          examenes_sangre_validados: true,
          evidencia_archivo_nombre: 'estudio_sangre.pdf',
          evidencia_archivo_url: 'data:application/pdf;base64,sample',
          parametros_hematologicos: 'Plaquetas: 220000/uL',
        },
      };
      mockService.setBloodExamValidation.mockResolvedValue({
        id: 'uuid-10',
        examenes_sangre_validados: true,
        evidencia_archivo_nombre: 'estudio_sangre.pdf',
      });

      await controller.updateExamStatus(mockReq as Request, mockRes as Response);

      expect(mockService.setBloodExamValidation).toHaveBeenCalledWith(
        'uuid-10',
        true,
        {
          evidencia_archivo_nombre: 'estudio_sangre.pdf',
          evidencia_archivo_url: 'data:application/pdf;base64,sample',
          parametros_hematologicos: 'Plaquetas: 220000/uL',
        }
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ examenes_sangre_validados: true }));
    });

    it('debe responder 400 cuando se lanza un error que no es Paciente no encontrado', async () => {
      mockReq = {
        params: { id: 'uuid-10' },
        body: { examenes_sangre_validados: true },
      };
      mockService.setBloodExamValidation.mockRejectedValue(new Error('Fallo de conexión'));

      await controller.updateExamStatus(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Fallo de conexión' });
    });

    it('debe responder 400 cuando updateExamStatus lanza un objeto no Error', async () => {
      mockReq = {
        params: { id: 'uuid-10' },
        body: { examenes_sangre_validados: true },
      };
      mockService.setBloodExamValidation.mockRejectedValue('String error');

      await controller.updateExamStatus(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error inesperado' });
    });
  });
});
