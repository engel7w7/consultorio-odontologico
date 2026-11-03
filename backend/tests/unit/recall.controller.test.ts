import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { RecallController } from '../../src/controllers/recall.controller';
import { RecallService, RecallError } from '../../src/services/recall.service';

describe('HU-14 RecallController - Unit Tests', () => {
  let controller: RecallController;
  let service: RecallService;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = {
      getProfilaxisVencidas: vi.fn(),
      getRetornoMensual: vi.fn(),
    } as unknown as RecallService;

    controller = new RecallController(service);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('responde 200 con la lista de profilaxis vencidas', async () => {
    const mockData = [
      {
        patient: { id: 'p-1', nombre: 'Juan', telefono: '71234567' },
        ultima_profilaxis: new Date(),
        fecha_vencimiento: new Date(),
        dias_atraso: 10,
        reagendado: false,
        proxima_cita: null,
      },
    ];

    vi.spyOn(service, 'getProfilaxisVencidas').mockResolvedValue(mockData as any);

    await controller.getProfilaxisVencidas(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockData);
  });

  it('responde 400 cuando el servicio lanza RecallError', async () => {
    vi.spyOn(service, 'getProfilaxisVencidas').mockRejectedValue(
      new RecallError('Error de consulta', 'RECALL_QUERY_ERROR')
    );

    await controller.getProfilaxisVencidas(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error de consulta',
      code: 'RECALL_QUERY_ERROR',
    });
  });

  it('responde 500 cuando ocurre un error inesperado', async () => {
    vi.spyOn(service, 'getProfilaxisVencidas').mockRejectedValue(new Error('Fatal Error'));

    await controller.getProfilaxisVencidas(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error interno al consultar las profilaxis vencidas',
    });
  });
});

describe('HU-15 RecallController - getRetornoMensual Unit Tests', () => {
  let controller: RecallController;
  let service: RecallService;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = {
      getProfilaxisVencidas: vi.fn(),
      getRetornoMensual: vi.fn(),
    } as unknown as RecallService;

    controller = new RecallController(service);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    req = { query: {} };
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('responde 200 con los datos de retorno mensual cuando el mes es válido', async () => {
    req.query = { mes: '2026-11' };

    const mockResponse = {
      mes: '2026-11',
      total: 1,
      ingreso_estimado_total: 150,
      pacientes: [
        {
          patient: { id: 'p-1', nombre: 'Carlos', telefono: '71111111' },
          ultima_profilaxis: new Date('2026-05-10'),
          fecha_vencimiento: new Date('2026-11-10'),
          estado: 'VENCE_ESTE_MES' as const,
          prioridad: 70,
          motivos: ['Vence este mes'],
          ingreso_estimado: 150,
        },
      ],
    };

    vi.spyOn(service, 'getRetornoMensual').mockResolvedValue(mockResponse);

    await controller.getRetornoMensual(req as Request, res as Response);

    expect(service.getRetornoMensual).toHaveBeenCalledWith('2026-11');
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockResponse);
  });

  it('responde 200 cuando se omite el parámetro mes (utiliza el mes por defecto)', async () => {
    req.query = {};

    const mockResponse = {
      mes: '2026-11',
      total: 0,
      ingreso_estimado_total: 0,
      pacientes: [],
    };

    vi.spyOn(service, 'getRetornoMensual').mockResolvedValue(mockResponse);

    await controller.getRetornoMensual(req as Request, res as Response);

    expect(service.getRetornoMensual).toHaveBeenCalledWith(undefined);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockResponse);
  });

  it('responde 400 cuando el formato del mes es inválido (ej. "2026-13")', async () => {
    req.query = { mes: '2026-13' };

    await controller.getRetornoMensual(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('El formato de mes debe ser YYYY-MM'),
      })
    );
  });

  it('responde 400 cuando el parámetro mes contiene texto no numérico', async () => {
    req.query = { mes: 'abc' };

    await controller.getRetornoMensual(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('El formato de mes debe ser YYYY-MM'),
      })
    );
  });

  it('responde 400 cuando el servicio lanza RecallError', async () => {
    req.query = { mes: '2026-11' };

    vi.spyOn(service, 'getRetornoMensual').mockRejectedValue(
      new RecallError('Error al calcular retorno mensual', 'RECALL_QUERY_ERROR')
    );

    await controller.getRetornoMensual(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error al calcular retorno mensual',
      code: 'RECALL_QUERY_ERROR',
    });
  });

  it('responde 500 cuando ocurre un error inesperado en el servicio', async () => {
    req.query = { mes: '2026-11' };

    vi.spyOn(service, 'getRetornoMensual').mockRejectedValue(new Error('Fatal DB crash'));

    await controller.getRetornoMensual(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Error interno al consultar la lista mensual de retorno',
    });
  });
});
