import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentController } from '../../src/controllers/appointment.controller.js';
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
      registerPayment: vi.fn(),
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

  describe('createAppointment (HU-08)', () => {
    it('responde 201 y la cita creada con datos válidos', async () => {
      mockService.createAppointment = vi.fn().mockResolvedValue({
        id: 'appt-100',
        patient_id: '123e4567-e89b-12d3-a456-426614174000',
        motivo: 'Control de rutina',
        fecha_inicio: '2026-10-15T10:00:00.000Z',
        fecha_fin: '2026-10-15T11:00:00.000Z',
        estado: 'PROGRAMADA',
      });

      mockReq = {
        body: {
          patient_id: '123e4567-e89b-12d3-a456-426614174000',
          motivo: 'Control de rutina',
          fecha_inicio: '2026-10-15T10:00:00.000Z',
          fecha_fin: '2026-10-15T11:00:00.000Z',
        },
      };

      await controller.createAppointment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'appt-100' }));
    });

    it('responde 400 cuando el cuerpo no cumple el esquema de validación', async () => {
      mockReq = {
        body: {
          patient_id: 'id-invalido',
          motivo: '',
          fecha_inicio: 'no-es-fecha',
          fecha_fin: 'no-es-fecha',
        },
      };

      await controller.createAppointment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          issues: expect.any(Array),
        })
      );
    });

    it('responde 422 cuando el servicio lanza alerta roja bloqueante de extracción sin exámenes', async () => {
      mockService.createAppointment = vi.fn().mockRejectedValue({
        code: 'EXTRACTION_BLOOD_EXAMS_REQUIRED',
        message: 'ALERTA ROJA BLOQUEANTE: No se puede agendar una extracción dental...',
      });

      mockReq = {
        body: {
          patient_id: '123e4567-e89b-12d3-a456-426614174000',
          motivo: 'Extracción de tercer molar',
          fecha_inicio: '2026-10-15T10:00:00.000Z',
          fecha_fin: '2026-10-15T11:00:00.000Z',
        },
      };

      await controller.createAppointment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'EXTRACTION_BLOOD_EXAMS_REQUIRED',
          error: expect.stringContaining('ALERTA ROJA BLOQUEANTE'),
        })
      );
    });

    it('responde 404 cuando el paciente no existe', async () => {
      mockService.createAppointment = vi.fn().mockRejectedValue({
        code: 'PATIENT_NOT_FOUND',
        message: 'Paciente no encontrado',
      });

      mockReq = {
        body: {
          patient_id: '123e4567-e89b-12d3-a456-426614174000',
          motivo: 'Control de rutina',
          fecha_inicio: '2026-10-15T10:00:00.000Z',
          fecha_fin: '2026-10-15T11:00:00.000Z',
        },
      };

      await controller.createAppointment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Paciente no encontrado' });
    });

    it('responde 400 cuando fecha_inicio no es anterior a fecha_fin', async () => {
      mockService.createAppointment = vi.fn().mockRejectedValue({
        code: 'START_TIME_MUST_BE_BEFORE_END_TIME',
        message: 'La hora de inicio debe ser anterior a la hora de fin',
      });

      mockReq = {
        body: {
          patient_id: '123e4567-e89b-12d3-a456-426614174000',
          motivo: 'Control de rutina',
          fecha_inicio: '2026-10-15T10:00:00.000Z',
          fecha_fin: '2026-10-15T11:00:00.000Z',
        },
      };

      await controller.createAppointment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'La hora de inicio debe ser anterior a la hora de fin',
      });
    });

    it('responde 500 en error interno del servidor al crear cita', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockService.createAppointment = vi.fn().mockRejectedValue(new Error('Fallo crítico'));

      mockReq = {
        body: {
          patient_id: '123e4567-e89b-12d3-a456-426614174000',
          motivo: 'Control de rutina',
          fecha_inicio: '2026-10-15T10:00:00.000Z',
          fecha_fin: '2026-10-15T11:00:00.000Z',
        },
      };

      await controller.createAppointment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno al agendar la cita' });
      consoleSpy.mockRestore();
    });
  });

  describe('updateStatus (HU-06)', () => {
    it('responde 200 con la cita actualizada a ATENDIDA o CANCELADA', async () => {
      const updated = { id: 'appt-1', estado: 'ATENDIDA' };
      mockReq = { params: { id: 'appt-1' }, body: { estado: 'ATENDIDA' } };
      mockService.updateAppointmentStatus = vi.fn().mockResolvedValue(updated);

      await controller.updateStatus(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(updated);
    });

    it('responde 400 cuando el estado es invalido', async () => {
      mockReq = { params: { id: 'appt-1' }, body: { estado: 'NO_VALIDO' } };

      await controller.updateStatus(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('responde 404 cuando la cita no existe', async () => {
      mockReq = { params: { id: 'appt-inexistente' }, body: { estado: 'ATENDIDA' } };
      mockService.updateAppointmentStatus = vi.fn().mockRejectedValue(new Error('Cita no encontrada'));

      await controller.updateStatus(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Cita no encontrada' });
    });

    it('responde 500 en fallo inesperado al actualizar estado', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReq = { params: { id: 'appt-1' }, body: { estado: 'ATENDIDA' } };
      mockService.updateAppointmentStatus = vi.fn().mockRejectedValue(new Error('Fallo de base de datos'));

      await controller.updateStatus(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno al actualizar la cita' });
      consoleSpy.mockRestore();
    });
  });

  describe('registerPayment (HU-11)', () => {
    it('responde 200 con el monto registrado', async () => {
      const appointment = { id: 'appt-1', monto_pagado: 150 };
      mockReq = { params: { id: 'appt-1' }, body: { monto_pagado: 150 } };
      mockService.registerPayment.mockResolvedValue(appointment);

      await controller.registerPayment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(appointment);
      expect(mockService.registerPayment).toHaveBeenCalledWith('appt-1', 150);
    });

    it('responde 400 cuando el monto es negativo', async () => {
      mockReq = { params: { id: 'appt-1' }, body: { monto_pagado: -1 } };

      await controller.registerPayment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockService.registerPayment).not.toHaveBeenCalled();
    });

    it('responde 404 cuando la cita a cobrar no existe', async () => {
      mockReq = { params: { id: 'appt-inexistente' }, body: { monto_pagado: 120 } };
      mockService.registerPayment.mockRejectedValue(new Error('Cita no encontrada'));

      await controller.registerPayment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Cita no encontrada' });
    });

    it('responde 422 cuando la cita no esta en estado ATENDIDA', async () => {
      mockReq = { params: { id: 'appt-1' }, body: { monto_pagado: 120 } };
      mockService.registerPayment.mockRejectedValue(
        new Error('Solo se pueden registrar cobros en citas atendidas')
      );

      await controller.registerPayment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Solo se pueden registrar cobros en citas atendidas',
      });
    });

    it('responde 500 en fallo inesperado al registrar cobro', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReq = { params: { id: 'appt-1' }, body: { monto_pagado: 120 } };
      mockService.registerPayment.mockRejectedValue(new Error('Fallo crítico'));

      await controller.registerPayment(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno al registrar el cobro' });
      consoleSpy.mockRestore();
    });
  });
});
