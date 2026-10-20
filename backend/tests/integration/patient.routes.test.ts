import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('QA Integration Tests - Rutas de Pacientes y Servidor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET / debe responder 200 y mensaje de la API', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.message).toBe('API Consultorio Odontológico');
    expect(res.body.environment).toBeDefined();
  });

  it('GET /health debe responder 200 y status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/health debe responder 200 y status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('debe inicializar en modo produccion si NODE_ENV es production', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalPort = process.env.PORT;
    try {
      vi.resetModules();
      process.env.NODE_ENV = 'production';
      process.env.PORT = '10000';
      const prodModule = await import('../../src/server');
      expect(prodModule.default).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.PORT = originalPort;
      vi.resetModules();
    }
  });


  it('POST /api/patients debe validar los datos de entrada y responder 400 si son inválidos', async () => {
    const res = await request(app)
      .post('/api/patients')
      .send({ nombre: '', telefono: '123', edad: -1 });
    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
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
    expect(res.body.id).toBe('uuid-test-1');
  });

  it('POST /api/patients debe responder 400 si el servicio lanza un error genérico', async () => {
    vi.spyOn(prisma.patient, 'create').mockRejectedValue(new Error('Fallo de inserción'));

    const res = await request(app)
      .post('/api/patients')
      .send({ nombre: 'Paciente Error', telefono: '70000000', edad: 30 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Fallo de inserción');
  });

  it('GET /api/patients debe listar los pacientes registrados con 200', async () => {
    vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([
      {
        id: 'uuid-1',
        nombre: 'Paciente Uno',
        telefono: '70000001',
        edad: 28,
        examenes_sangre_validados: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    ]);

    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  it('GET /api/patients?search debe buscar por nombre o teléfono', async () => {
    const findManySpy = vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([]);

    const res = await request(app).get('/api/patients?search=Ana%207');

    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith({
      where: {
        OR: [
          { nombre: { contains: 'Ana 7', mode: 'insensitive' } },
          { telefono: { contains: 'Ana 7' } },
        ],
      },
      orderBy: { created_at: 'desc' },
    });
  });

  it('GET /api/patients debe responder 400 si la búsqueda es demasiado larga', async () => {
    const res = await request(app).get(`/api/patients?search=${'a'.repeat(101)}`);

    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
  });

  it('GET /api/patients debe responder 500 si ocurre un fallo al obtener pacientes', async () => {
    vi.spyOn(prisma.patient, 'findMany').mockRejectedValue(new Error('Fallo de lectura en BD'));

    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Fallo de lectura en BD');
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
    expect(res.body.examenes_sangre_validados).toBe(true);
  });

  it('PATCH /api/patients/:id/blood-exams debe responder 404 si el paciente no existe', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/patients/uuid-inexistente/blood-exams')
      .send({ examenes_sangre_validados: true });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Paciente no encontrado');
  });

  it('PATCH /api/patients/:id/blood-exams debe responder 400 si el body es inválido', async () => {
    const res = await request(app)
      .patch('/api/patients/uuid-1/blood-exams')
      .send({ examenes_sangre_validados: 'invalido' });

    expect(res.status).toBe(400);
  });

  it('GET /api/patients/:id debe responder 404 si la ruta no existe', async () => {
    const res = await request(app).get('/api/patients/uuid-no-existente');
    expect(res.status).toBe(404);
  });
});