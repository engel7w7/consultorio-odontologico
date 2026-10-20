import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { prisma } from '../../src/config/prisma.js';
import * as authUtils from '../../src/utils/auth.utils.js';

describe('QA Integration Tests - Rutas de Autenticación (HU-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = 'test-secret-integration-jwt';
  });

  it('POST /api/auth/login responde 200 y devuelve el token cuando las credenciales son válidas', async () => {
    const password = 'PasswordSeguro123';
    const hash = await authUtils.hashPassword(password);

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
      id: 'doc-user-1',
      email: 'doctor@consultorio.com',
      password: hash,
      nombre: 'Dr. Diego Alvarado',
      especialidad: 'Cirujano Dentista',
      rol: 'ODONTOLOGO',
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    const res = await request(app).post('/api/auth/login').send({
      email: 'doctor@consultorio.com',
      password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toEqual({
      id: 'doc-user-1',
      email: 'doctor@consultorio.com',
      nombre: 'Dr. Diego Alvarado',
      especialidad: 'Cirujano Dentista',
      rol: 'ODONTOLOGO',
    });
  });

  it('POST /api/auth/login responde 401 si las credenciales son erróneas', async () => {
    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'doctor@consultorio.com',
      password: 'WrongPassword123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas. Verifique su correo o contraseña.');
  });

  it('GET /api/auth/me responde 200 con el perfil del usuario autenticado', async () => {
    const token = authUtils.generateToken({
      userId: 'doc-user-1',
      email: 'doctor@consultorio.com',
      rol: 'ODONTOLOGO',
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'doc-user-1',
      email: 'doctor@consultorio.com',
      nombre: 'Dr. Diego Alvarado',
      especialidad: 'Cirujano Dentista',
      rol: 'ODONTOLOGO',
    } as any);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('doctor@consultorio.com');
  });

  it('GET /api/auth/me responde 401 si no se envía token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Sesión no iniciada o token no provisto');
  });
});
