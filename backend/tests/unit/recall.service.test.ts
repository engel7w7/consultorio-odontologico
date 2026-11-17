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

describe('HU-15 RecallService - getRetornoMensual Unit Tests', () => {
  let service: RecallService;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new RecallService(prisma);
  });

  it('recupera citas y calcula la lista mensual con totales', async () => {
    const paciente = { id: 'p-1', nombre: 'Test Paciente', telefono: '71234567' };
    const citasSimuladas = [
      {
        id: 'c-1',
        patient_id: paciente.id,
        patient: paciente,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: new Date(2026, 4, 15, 10, 0, 0), // Mayo 2026 -> vence Nov 2026
        fecha_fin: new Date(2026, 4, 15, 10, 30, 0),
        estado: 'ATENDIDA',
        monto_pagado: 150,
      },
    ];

    const findManySpy = vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue(citasSimuladas as any);

    const hoy = new Date(2026, 10, 20); // Noviembre 2026
    const res = await service.getRetornoMensual('2026-11', hoy);

    expect(findManySpy).toHaveBeenCalled();
    expect(res.mes).toBe('2026-11');
    expect(res.total).toBe(1);
    expect(res.ingreso_estimado_total).toBe(150);
    expect(res.pacientes[0].patient.id).toBe(paciente.id);
    expect(res.pacientes[0].estado).toBe('VENCE_ESTE_MES');
  });

  it('usa el mes actual en America/La_Paz si no se especifica el parámetro mes', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue([]);

    const hoy = new Date('2026-11-15T12:00:00Z');
    const res = await service.getRetornoMensual(undefined, hoy);

    expect(res.mes).toBe('2026-11');
    expect(res.total).toBe(0);
    expect(res.pacientes).toEqual([]);
  });

  it('lanza RecallError cuando la base de datos falla en getRetornoMensual', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockRejectedValue(new Error('Connection timeout'));

    await expect(service.getRetornoMensual('2026-11')).rejects.toThrow(RecallError);
  });

  it('re-lanza RecallError si el error ya es una instancia de RecallError en getRetornoMensual', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockRejectedValue(
      new RecallError('Error personalizado', 'RECALL_CUSTOM')
    );

    await expect(service.getRetornoMensual('2026-11')).rejects.toThrow('Error personalizado');
  });
});
