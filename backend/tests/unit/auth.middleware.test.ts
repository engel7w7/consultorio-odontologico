import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireAuth, AuthenticatedRequest } from '../../src/middlewares/auth.middleware.js';
import { Request, Response, NextFunction } from 'express';
import * as authUtils from '../../src/utils/auth.utils.js';

describe('QA Unit Tests: Auth Middleware (requireAuth)', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let nextMock: NextFunction;
  let statusMock: any;
  let jsonMock: any;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-middleware-123';
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    nextMock = vi.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('permite el paso en modo test si no se envía encabezado de autenticación', () => {
    process.env.NODE_ENV = 'test';
    mockReq = {
      headers: {},
    };

    requireAuth(mockReq as Request, mockRes as Response, nextMock);

    expect(nextMock).toHaveBeenCalledOnce();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('bloquea con 401 en modo producción si no se envía encabezado de autorización', () => {
    process.env.NODE_ENV = 'production';
    mockReq = {
      headers: {},
    };

    requireAuth(mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Acceso no autorizado'),
      })
    );
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('bloquea con 401 si el token no tiene el formato Bearer', () => {
    process.env.NODE_ENV = 'production';
    mockReq = {
      headers: {
        authorization: 'Basic dXNlcjpwYXNz',
      },
    };

    requireAuth(mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('bloquea con 401 si el token proporcionado es inválido o expirado', () => {
    process.env.NODE_ENV = 'test';
    mockReq = {
      headers: {
        authorization: 'Bearer token.invalido.123',
      },
    };

    requireAuth(mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Sesión expirada o token de autenticación inválido'),
      })
    );
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('asigna el usuario a la petición y llama a next() cuando el token es válido', () => {
    process.env.NODE_ENV = 'production';
    const validToken = authUtils.generateToken({
      userId: 'doc-123',
      email: 'doctor@consultorio.com',
      rol: 'ODONTOLOGO',
    });

    mockReq = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    };

    requireAuth(mockReq as Request, mockRes as Response, nextMock);

    expect(nextMock).toHaveBeenCalledOnce();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user?.userId).toBe('doc-123');
    expect(mockReq.user?.email).toBe('doctor@consultorio.com');
  });
});
