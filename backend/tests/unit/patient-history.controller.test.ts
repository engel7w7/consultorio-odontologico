import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientHistoryController } from '../../src/controllers/patient-history.controller.js';
import { PatientHistoryError } from '../../src/services/patient-history.service.js';
import { Request, Response } from 'express';

describe('QA Unit Tests: PatientHistoryController (HU-10)', () => {
  const patientId = '123e4567-e89b-12d3-a456-426614174000';

  let controller: PatientHistoryController;
  let mockService: any;
  let mockRes: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = {
      getHistory: vi.fn(),
    };
    controller = new PatientHistoryController(mockService);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
  });

  it('responde 200 con el historial y usa orden desc por defecto', async () => {
    const historial = { patient: { id: patientId }, total: 0, tratamientos: [] };
    mockService.getHistory.mockResolvedValue(historial);

    await controller.getHistory({ params: { id: patientId }, query: {} } as unknown as Request, mockRes as Response);

    expect(mockService.getHistory).toHaveBeenCalledWith(patientId, 'desc');
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(historial);
  });

  it('pasa orden asc al servicio cuando se envía ?orden=asc', async () => {
    mockService.getHistory.mockResolvedValue({});

    await controller.getHistory(
      { params: { id: patientId }, query: { orden: 'asc' } } as unknown as Request,
      mockRes as Response
    );

    expect(mockService.getHistory).toHaveBeenCalledWith(patientId, 'asc');
  });

  it('responde 400 si el id no es un UUID válido', async () => {
    await controller.getHistory(
      { params: { id: 'no-es-uuid' }, query: {} } as unknown as Request,
      mockRes as Response
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'ID de paciente debe ser un UUID válido' })
    );
    expect(mockService.getHistory).not.toHaveBeenCalled();
  });

  it('responde 400 si el orden no es asc ni desc', async () => {
    await controller.getHistory(
      { params: { id: patientId }, query: { orden: 'xyz' } } as unknown as Request,
      mockRes as Response
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(mockService.getHistory).not.toHaveBeenCalled();
  });

  it('responde 404 si el paciente no existe', async () => {
    mockService.getHistory.mockRejectedValue(
      new PatientHistoryError('Paciente no encontrado', 'PATIENT_NOT_FOUND')
    );

    await controller.getHistory({ params: { id: patientId }, query: {} } as unknown as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Paciente no encontrado',
      code: 'PATIENT_NOT_FOUND',
    });
  });

  it('responde 500 ante un error inesperado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockService.getHistory.mockRejectedValue(new Error('DB caída'));

    await controller.getHistory({ params: { id: patientId } } as unknown as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error interno al consultar el historial de tratamientos',
    });
  });
});
