import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { prisma } from '../../src/config/prisma.js';

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

  it('POST /api/appointments responde 201 y crea la cita correctamente', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
      id: 'p-1',
      nombre: 'Lucía Méndez',
      examenes_sangre_validados: false,
    } as any);

    vi.spyOn(prisma.appointment, 'create').mockResolvedValue({
      id: 'appt-1',
      patient_id: 'p-1',
      motivo: 'Control de rutina',
      fecha_inicio: new Date('2026-10-15T10:00:00.000Z'),
      fecha_fin: new Date('2026-10-15T10:30:00.000Z'),
      estado: 'PROGRAMADA',
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    const res = await request(app).post('/api/appointments').send({
      patient_id: '123e4567-e89b-12d3-a456-426614174000',
      motivo: 'Control de rutina',
      fecha_inicio: '2026-10-15T10:00:00.000Z',
      fecha_fin: '2026-10-15T10:30:00.000Z',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('appt-1');
  });

  it('POST /api/appointments responde 422 si intenta agendar extracción sin exámenes validados', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      nombre: 'Lucía Méndez',
      examenes_sangre_validados: false,
    } as any);

    const res = await request(app).post('/api/appointments').send({
      patient_id: '123e4567-e89b-12d3-a456-426614174000',
      motivo: 'Extracción de tercer molar',
      fecha_inicio: '2026-10-15T10:00:00.000Z',
      fecha_fin: '2026-10-15T10:30:00.000Z',
    });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('EXTRACTION_BLOOD_EXAMS_REQUIRED');
  });

  it('PATCH /api/appointments/:id/status debe actualizar una cita', async () => {
    vi.spyOn(prisma.appointment, 'findUnique').mockResolvedValue({ id: 'appt-1' } as any);
    vi.spyOn(prisma.appointment, 'update').mockResolvedValue({
      id: 'appt-1',
      estado: 'ATENDIDA',
      patient: { id: 'p-1', nombre: 'Ana', examenes_sangre_validados: true },
    } as any);

    const res = await request(app)
      .patch('/api/appointments/appt-1/status')
      .send({ estado: 'ATENDIDA' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ATENDIDA');
  });

  it('PATCH /api/appointments/:id/status debe rechazar estados inválidos', async () => {
    const res = await request(app)
      .patch('/api/appointments/appt-1/status')
      .send({ estado: 'PROGRAMADA' });

    expect(res.status).toBe(400);
  });

  it('PATCH /api/appointments/:id/payment debe registrar el monto pagado', async () => {
    vi.spyOn(prisma.appointment, 'findUnique').mockResolvedValue({
      id: 'appt-1',
      estado: 'ATENDIDA',
    } as any);
    vi.spyOn(prisma.appointment, 'update').mockResolvedValue({
      id: 'appt-1',
      monto_pagado: 150,
      patient: { id: 'p-1', nombre: 'Ana', telefono: '71234567' },
    } as any);

    const res = await request(app)
      .patch('/api/appointments/appt-1/payment')
      .send({ monto_pagado: 150 });

    expect(res.status).toBe(200);
    expect(res.body.monto_pagado).toBe(150);
  });

  it('PATCH /api/appointments/:id/payment debe rechazar el cobro con 422 si la cita no esta en estado ATENDIDA', async () => {
    vi.spyOn(prisma.appointment, 'findUnique').mockResolvedValue({
      id: 'appt-1',
      estado: 'PROGRAMADA',
    } as any);

    const res = await request(app)
      .patch('/api/appointments/appt-1/payment')
      .send({ monto_pagado: 150 });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Solo se pueden registrar cobros en citas atendidas');
  });

  it('PATCH /api/appointments/:id/payment debe rechazar montos negativos', async () => {
    const res = await request(app)
      .patch('/api/appointments/appt-1/payment')
      .send({ monto_pagado: -1 });

    expect(res.status).toBe(400);
  });
});
