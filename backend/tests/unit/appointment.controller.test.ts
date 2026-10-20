import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentController } from '../../src/controllers/appointment.controller';
import { Request, Response } from 'express';
import { z } from 'zod';

describe('QA Unit Tests: AppointmentController (HU-04)', () => {
  let controller: AppointmentController;
  let mockService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = {
      getDailyAppointments: vi.fn(),
      updateAppointmentStatus: vi.fn(),
    };
    controller = new AppointmentController(mockService);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('debe responder 200 con las citas cuando los parámetros son válidos', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        patient_id: 'p-1',
        motivo: 'Control de brackets',
        fecha_inicio: '2026-10-13T14:00:00.000Z',
        fecha_fin: '2026-10-13T15:00:00.000Z',
        estado: 'PROGRAMADA',
      },
    ];
    mockReq = {
      query: { date: '2026-10-13' },
    };
    mockService.getDailyAppointments.mockResolvedValue(mockAppointments);

    await controller.getAppointments(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockAppointments);
    expect(mockService.getDailyAppointments).toHaveBeenCalledWith('2026-10-13');
  });

  it('debe responder 200 cuando no se envía fecha (usa la fecha por defecto)', async () => {
    mockReq = {
      query: {},
    };
    mockService.getDailyAppointments.mockResolvedValue([]);

    await controller.getAppointments(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);
    expect(mockService.getDailyAppointments).toHaveBeenCalledWith(undefined);
  });

  it('debe responder 400 cuando la fecha tiene formato inválido', async () => {
    mockReq = {
      query: { date: '13-10-2026' },
    };

    await controller.getAppointments(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'El formato de fecha debe ser YYYY-MM-DD',
        issues: expect.any(Array),
      })
    );
    expect(mockService.getDailyAppointments).not.toHaveBeenCalled();
  });

  it('debe responder 400 cuando la fecha es inexistente en el calendario', async () => {
    mockReq = {
      query: { date: '2026-02-30' },
    };

    await controller.getAppointments(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Fecha inválida',
        issues: expect.any(Array),
      })
    );
    expect(mockService.getDailyAppointments).not.toHaveBeenCalled();
  });

  it('debe responder 400 con mensaje fallback si ZodError no contiene issues', async () => {
    mockReq = {
      query: { date: '2026-10-13' },
    };
    const emptyZodError = new z.ZodError([]);
    mockService.getDailyAppointments.mockRejectedValue(emptyZodError);

    await controller.getAppointments(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error de validación',
      issues: [],
    });
  });

  it('debe responder 500 genérico sin exponer el mensaje interno cuando el servicio lanza un Error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReq = {
      query: { date: '2026-10-13' },
    };
    mockService.getDailyAppointments.mockRejectedValue(new Error('Fallo crítico en Postgres (detalles sensibles)'));

    await controller.getAppointments(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno al consultar la agenda' });
    expect(consoleSpy).toHaveBeenCalledWith('Error al consultar la agenda:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('debe responder 500 genérico cuando el servicio lanza un objeto no Error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReq = {
      query: {},
    };
    mockService.getDailyAppointments.mockRejectedValue('String de error desconocido');

    await controller.getAppointments(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno al consultar la agenda' });
    expect(consoleSpy).toHaveBeenCalledWith('Error al consultar la agenda:', 'String de error desconocido');

    consoleSpy.mockRestore();
  });

  it('debe actualizar una cita a atendida', async () => {
    const appointment = { id: 'appt-1', estado: 'ATENDIDA' };
    mockReq = { params: { id: 'appt-1' }, body: { estado: 'ATENDIDA' } };
    mockService.updateAppointmentStatus.mockResolvedValue(appointment);

    await controller.updateStatus(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(appointment);
    expect(mockService.updateAppointmentStatus).toHaveBeenCalledWith(
      'appt-1',
      'ATENDIDA'
    );
  });

  it('debe responder 400 si el estado no es válido', async () => {
    mockReq = { params: { id: 'appt-1' }, body: { estado: 'PROGRAMADA' } };

    await controller.updateStatus(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(mockService.updateAppointmentStatus).not.toHaveBeenCalled();
  });

  it('debe responder 404 si la cita no existe', async () => {
    mockReq = { params: { id: 'inexistente' }, body: { estado: 'CANCELADA' } };
    mockService.updateAppointmentStatus.mockRejectedValue(new Error('Cita no encontrada'));

    await controller.updateStatus(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Cita no encontrada' });
  });
});
