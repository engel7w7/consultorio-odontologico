import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  BCRYPT_SALT_ROUNDS,
} from '../../src/utils/auth.utils.js';

describe('QA Unit Tests: Auth Utils (HU-01)', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-12345';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('hashPassword genera un hash válido con bcrypt (costo >= 10)', async () => {
    expect(BCRYPT_SALT_ROUNDS).toBeGreaterThanOrEqual(10);
    const password = 'PasswordSeguro123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifyPassword valida correctamente contraseñas coincidentes y rechaza erróneas', async () => {
    const password = 'CorrectPassword456';
    const hash = await hashPassword(password);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('generateToken y verifyToken generan y verifican un JWT válido', () => {
    const payload = {
      userId: 'user-uuid-1',
      email: 'doctor@consultorio.com',
      rol: 'ODONTOLOGO',
    };

    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.rol).toBe(payload.rol);
    expect(decoded?.exp).toBeGreaterThan(Date.now());
  });

  it('generateToken lanza error si JWT_SECRET no está configurado', () => {
    delete process.env.JWT_SECRET;
    expect(() => {
      generateToken({
        userId: 'user-uuid-1',
        email: 'doctor@consultorio.com',
        rol: 'ODONTOLOGO',
      });
    }).toThrow('JWT_SECRET no configurado en variables de entorno');
  });

  it('verifyToken retorna null si el token es inválido o está corrupto', () => {
    expect(verifyToken('invalido.token')).toBeNull();
    expect(verifyToken('')).toBeNull();
    expect(verifyToken('a.b.c')).toBeNull();
  });

  it('verifyToken retorna null si la firma no coincide', () => {
    const token = generateToken({
      userId: 'user-uuid-1',
      email: 'doctor@consultorio.com',
      rol: 'ODONTOLOGO',
    });

    const parts = token.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.badsignature`;
    expect(verifyToken(tamperedToken)).toBeNull();
  });

  it('verifyToken retorna null si el token ha expirado', () => {
    const payload = {
      userId: 'user-1',
      email: 'doc@test.com',
      rol: 'ODONTOLOGO',
      exp: Date.now() - 1000,
    };
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const crypto = require('node:crypto');
    const signature = crypto
      .createHmac('sha256', process.env.JWT_SECRET!)
      .update(`${header}.${body}`)
      .digest('base64url');
    const expiredToken = `${header}.${body}.${signature}`;

    expect(verifyToken(expiredToken)).toBeNull();
  });
});
