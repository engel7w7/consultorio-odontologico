import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecallService, RecallError } from '../../src/services/recall.service';
import { prisma } from '../../src/config/prisma';

describe('HU-14 RecallService - Unit Tests', () => {
  let service: RecallService;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new RecallService(prisma);
  });

  it('recupera las citas y retorna la lista procesada', async () => {
    const paciente = { id: 'p-1', nombre: 'Test Paciente', telefono: '71234567' };
    const citasSimuladas = [
      {
        id: 'c-1',
        patient_id: paciente.id,
        patient: paciente,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: new Date(2026, 2, 1, 10, 0, 0),
        fecha_fin: new Date(2026, 2, 1, 10, 30, 0),
        estado: 'ATENDIDA',
      },
    ];

    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue(citasSimuladas as any);

    const fechaHoy = new Date(2026, 10, 1);
    const resultado = await service.getProfilaxisVencidas(fechaHoy);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].patient.nombre).toBe('Test Paciente');
    expect(resultado[0].dias_atraso).toBeGreaterThan(0);
  });

  it('lanza RecallError cuando la base de datos falla', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockRejectedValue(new Error('DB Error'));

    await expect(service.getProfilaxisVencidas()).rejects.toThrow(RecallError);
  });

  it('re-lanza RecallError si el error ya es una instancia de RecallError', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockRejectedValue(
      new RecallError('Falla específica', 'CUSTOM_RECALL_ERROR')
    );

    await expect(service.getProfilaxisVencidas()).rejects.toThrow('Falla específica');
  });

  it('usa la fecha actual por defecto si no se pasa fechaReferencia', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue([]);
    const res = await service.getProfilaxisVencidas();
    expect(res).toEqual([]);
  });
});

