import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../../src/controllers/auth.controller.js';
import { AuthService } from '../../src/services/auth.service.js';
import { Request, Response } from 'express';

describe('QA Unit Tests: AuthController (HU-01)', () => {
  let controller: AuthController;
  let mockService: {
    login: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = {
      login: vi.fn(),
      getCurrentUser: vi.fn(),
    };
    controller = new AuthController(mockService as unknown as AuthService);

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('login', () => {
    it('responde 200 y el token con usuario cuando las credenciales son válidas', async () => {
      const mockResult = {
        token: 'header.payload.signature',
        user: {
          id: 'doc-1',
          email: 'doctor@consultorio.com',
          nombre: 'Dr. Soto',
          especialidad: 'Odontólogo',
          rol: 'ODONTOLOGO',
        },
      };
      mockReq = {
        body: {
          email: 'doctor@consultorio.com',
          password: 'PasswordValido123',
        },
      };
      mockService.login.mockResolvedValue(mockResult);

      await controller.login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });

    it('responde 400 cuando los datos de entrada no cumplen el esquema', async () => {
      mockReq = {
        body: {
          email: 'correo-invalido',
          password: '123',
        },
      };

      await controller.login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          issues: expect.any(Array),
        })
      );
      expect(mockService.login).not.toHaveBeenCalled();
    });

    it('responde 401 cuando el servicio rechaza con INVALID_CREDENTIALS', async () => {
      mockReq = {
        body: {
          email: 'doctor@consultorio.com',
          password: 'PasswordIncorrecto123',
        },
      };
      mockService.login.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

      await controller.login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Credenciales inválidas. Verifique su correo o contraseña.',
      });
    });

    it('responde 500 cuando ocurre un error imprevisto', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReq = {
        body: {
          email: 'doctor@consultorio.com',
          password: 'PasswordValido123',
        },
      };
      mockService.login.mockRejectedValue(new Error('Fallo de conexión a la base de datos'));

      await controller.login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno en el servidor de autenticación',
      });
      consoleSpy.mockRestore();
    });
  });

  describe('me', () => {
    it('responde 200 con el perfil del usuario autenticado', async () => {
      const mockUser = {
        id: 'doc-1',
        email: 'doctor@consultorio.com',
        nombre: 'Dr. Soto',
        especialidad: 'Odontólogo',
        rol: 'ODONTOLOGO',
      };
      mockReq = {
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
      };
      mockService.getCurrentUser.mockResolvedValue(mockUser);

      await controller.me(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
      expect(mockService.getCurrentUser).toHaveBeenCalledWith('valid.jwt.token');
    });

    it('responde 401 si falta el encabezado Authorization o no empieza con Bearer', async () => {
      mockReq = {
        headers: {},
      };

      await controller.me(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Sesión no iniciada o token no provisto',
      });
    });

    it('responde 401 si el servicio indica que el token expiró o el usuario no existe', async () => {
      mockReq = {
        headers: {
          authorization: 'Bearer expired.jwt.token',
        },
      };
      mockService.getCurrentUser.mockRejectedValue(new Error('INVALID_OR_EXPIRED_TOKEN'));

      await controller.me(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Sesión expirada o inválida',
      });
    });

    it('responde 500 ante un fallo inesperado del servidor', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReq = {
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
      };
      mockService.getCurrentUser.mockRejectedValue(new Error('Crash in DB'));

      await controller.me(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno al verificar la sesión',
      });
      consoleSpy.mockRestore();
    });
  });
});
