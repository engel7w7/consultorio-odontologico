import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('QA Integration Tests - Rutas de Pacientes y Servidor', () => {
  
  it('GET /health debe responder 200 y status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/patients debe validar los datos de entrada y responder 400 si son inválidos', async () => {
    const res = await request(app)
      .post('/api/patients')
      .send({ nombre: '', telefono: '123', edad: -1 });
    expect(res.status).toBe(400);
  });

  it('POST /api/patients debe registrar un paciente exitosamente con 201', async () => {
    vi.spyOn(prisma.patient, 'create').mockResolvedValue({
      id: 'uuid-test-1',
      nombre: 'Paciente Prueba',
      telefono: '70000000',
      edad: 30,
      examenes_sangre_validados: false,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/patients')
      .send({ nombre: 'Paciente Prueba', telefono: '70000000', edad: 30 });
    
    expect([200, 201]).toContain(res.status);
  });

  it('GET /api/patients/:id debe responder 404 si el paciente no existe', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);
    const res = await request(app).get('/api/patients/uuid-no-existente');
    expect(res.status).toBe(404);
  });

  it('PATCH /api/patients/:id/blood-exams debe actualizar exitosamente al paciente', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
      id: 'uuid-1',
      nombre: 'Lucía Méndez',
      examenes_sangre_validados: false,
    } as any);

    vi.spyOn(prisma.patient, 'update').mockResolvedValue({
      id: 'uuid-1',
      nombre: 'Lucía Méndez',
      examenes_sangre_validados: true,
    } as any);

    const res = await request(app)
      .patch('/api/patients/uuid-1/blood-exams')
      .send({ examenes_sangre_validados: true });

    expect([200, 204]).toContain(res.status);
  });

});