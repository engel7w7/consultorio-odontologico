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
