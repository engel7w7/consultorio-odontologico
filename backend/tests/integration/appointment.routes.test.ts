import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('QA Integration Tests - Rutas de Citas y Agenda (HU-04)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/appointments?date=... devuelve las citas en orden cronológico con status 200', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        patient_id: 'p-1',
        motivo: 'Limpieza bucal y sarro',
        fecha_inicio: new Date('2026-10-13T13:00:00.000Z'),
        fecha_fin: new Date('2026-10-13T13:45:00.000Z'),
        estado: 'PROGRAMADA',
        created_at: new Date(),
        updated_at: new Date(),
        patient: {
          id: 'p-1',
          nombre: 'Lucía Méndez',
        },
      },
      {
        id: 'appt-2',
        patient_id: 'p-2',
        motivo: 'Extracción de tercer molar',
        fecha_inicio: new Date('2026-10-13T15:00:00.000Z'),
        fecha_fin: new Date('2026-10-13T16:00:00.000Z'),
        estado: 'PROGRAMADA',
        created_at: new Date(),
        updated_at: new Date(),
        patient: {
          id: 'p-2',
          nombre: 'Carlos Mendoza',
        },
      },
    ];

    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue(mockAppointments as any);

    const res = await request(app).get('/api/appointments?date=2026-10-13');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].motivo).toBe('Limpieza bucal y sarro');
    expect(res.body[1].motivo).toBe('Extracción de tercer molar');
    expect(res.body[0].patient.nombre).toBe('Lucía Méndez');
  });

  it('GET /api/appointments?date=2026-02-30 debe responder 400 por fecha inexistente', async () => {
    const res = await request(app).get('/api/appointments?date=2026-02-30');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Fecha inválida');
    expect(res.body.issues).toBeDefined();
  });

  it('GET /api/appointments sin parámetro de fecha debe responder 200 consultando el día actual', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue([]);

    const res = await request(app).get('/api/appointments');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/appointments debe responder 500 genérico si ocurre un fallo en la base de datos', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(prisma.appointment, 'findMany').mockRejectedValue(new Error('Fallo de conexión en DB'));

    const res = await request(app).get('/api/appointments?date=2026-10-13');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno al consultar la agenda');
    expect(res.body.message).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('PATCH /api/appointments/:id/status debe actualizar la cita', async () => {
    vi.spyOn(prisma.appointment, 'findUnique').mockResolvedValue({ id: 'appt-1' } as any);
    vi.spyOn(prisma.appointment, 'update').mockResolvedValue({
      id: 'appt-1',
      estado: 'CANCELADA',
      patient: { id: 'p-1', nombre: 'Lucía Méndez' },
    } as any);

    const res = await request(app)
      .patch('/api/appointments/appt-1/status')
      .send({ estado: 'CANCELADA' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('CANCELADA');
  });

  it('PATCH /api/appointments/:id/status debe validar el estado', async () => {
    const res = await request(app)
      .patch('/api/appointments/appt-1/status')
      .send({ estado: 'PROGRAMADA' });

    expect(res.status).toBe(400);
  });
});
