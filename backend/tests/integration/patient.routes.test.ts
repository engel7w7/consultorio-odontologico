import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/server';

describe('QA Integration Tests: Express API (Supertest)', () => {
  it('GET /api/health debe responder 200 y status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/patients responde 400 Bad Request si los datos son invalidos', async () => {
    const res = await request(app)
      .post('/api/patients')
      .send({ nombre: '', telefono: '123', edad: -1 });
    expect(res.status).toBe(400);
  });

  it('GET /api/patients/:id responde 404 si el paciente no existe', async () => {
    const res = await request(app).get('/api/patients/id-no-existente');
    expect(res.status).toBe(404);
  });
});