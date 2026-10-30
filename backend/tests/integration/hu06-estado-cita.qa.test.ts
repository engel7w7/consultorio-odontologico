import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { generateToken } from '../../src/utils/auth.utils';

// QA - Pruebas de integración HU-06 (Estado de cita: Atendido / Cancelado)
// Escenario crítico SQAP (Secc. 7): "el cambio de estado a Atendido o Cancelado
// se refleja sin perder el registro".

const cita = {
  id: 'appt-1',
  patient_id: 'p-1',
  motivo: 'Limpieza dental',
  fecha_inicio: new Date('2026-10-20T14:00:00.000Z'),
  fecha_fin: new Date('2026-10-20T15:00:00.000Z'),
  estado: 'PROGRAMADA',
};

describe('QA Integración - HU-06 Cambio de estado de cita', () => {
  let auth = '';
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'qa-test-secret';
    auth = `Bearer ${generateToken({ userId: 'qa-user', email: 'qa@test.com', rol: 'ODONTOLOGO' })}`;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const patch = (id: string, body: object) =>
    request(app).patch(`/api/appointments/${id}/status`).set('Authorization', auth).send(body);

  it.each(['ATENDIDA', 'CANCELADA'])('CP-06-01: cambiar a %s -> 200 con el nuevo estado', async (estado) => {
    vi.spyOn(prisma.appointment, 'findUnique').mockResolvedValue(cita as any);
    vi.spyOn(prisma.appointment, 'update').mockResolvedValue({ ...cita, estado } as any);

    const res = await patch('appt-1', { estado });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe(estado);
  });

  it('CP-06-02: el registro NO se elimina y solo cambia el estado', async () => {
    vi.spyOn(prisma.appointment, 'findUnique').mockResolvedValue(cita as any);
    const update = vi.spyOn(prisma.appointment, 'update').mockResolvedValue({ ...cita, estado: 'CANCELADA' } as any);
    const del = vi.spyOn(prisma.appointment, 'delete');

    await patch('appt-1', { estado: 'CANCELADA' });

    expect(del).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].data).toEqual({ estado: 'CANCELADA' });
  });

  it.each([{ estado: 'PROGRAMADA' }, { estado: 'cancelada' }, {}])(
    'CP-06-03: estado inválido %o -> 400 y no actualiza',
    async (body) => {
      const update = vi.spyOn(prisma.appointment, 'update');

      const res = await patch('appt-1', body);

      expect(res.status).toBe(400);
      expect(update).not.toHaveBeenCalled();
    }
  );

  it('CP-06-04: cita inexistente -> 404', async () => {
    vi.spyOn(prisma.appointment, 'findUnique').mockResolvedValue(null);
    const update = vi.spyOn(prisma.appointment, 'update');

    const res = await patch('no-existe', { estado: 'ATENDIDA' });

    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });
});
