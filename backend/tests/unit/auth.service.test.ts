import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service.js';
import { PrismaClient } from '@prisma/client';
import * as authUtils from '../../src/utils/auth.utils.js';

describe('QA Unit Tests: AuthService (HU-01)', () => {
  let service: AuthService;
  let mockPrisma: {
    user: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-service-1234';
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new AuthService(mockPrisma as unknown as PrismaClient);
  });

  describe('login', () => {
    it('inicia sesión exitosamente cuando el correo y contraseña son correctos', async () => {
      const password = 'DoctorPassword123';
      const hash = await authUtils.hashPassword(password);
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'doc-uuid-1',
        email: 'doctor@consultorio.com',
        password: hash,
        nombre: 'Dr. Alejandro Soto',
        especialidad: 'Cirujano Dentista',
        rol: 'ODONTOLOGO',
      });

      const result = await service.login({
        email: 'DOCTOR@consultorio.com ',
        password,
      });

      expect(result).toHaveProperty('token');
      expect(result.user).toEqual({
        id: 'doc-uuid-1',
        email: 'doctor@consultorio.com',
        nombre: 'Dr. Alejandro Soto',
        especialidad: 'Cirujano Dentista',
        rol: 'ODONTOLOGO',
      });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'doctor@consultorio.com',
            mode: 'insensitive',
          },
        },
      });
    });

    it('inicia sesión exitosamente y actualiza credenciales si el usuario tenía formato no estándar', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'doc-plain-1',
        email: 'dr.oropeza@gmail.com',
        password: 'Prueba123',
        nombre: 'Dr. Carlos Oropeza',
        especialidad: 'Odontología General',
        rol: 'ODONTOLOGO',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'dr.oropeza@gmail.com',
        password: 'Prueba123',
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('dr.oropeza@gmail.com');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-plain-1' },
          data: expect.objectContaining({
            password: expect.stringMatching(/^\$2/),
          }),
        })
      );
    });

    it('lanza INVALID_CREDENTIALS si el usuario no existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'noexiste@consultorio.com',
          password: 'Password123',
        })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('lanza INVALID_CREDENTIALS si la contraseña es incorrecta', async () => {
      const hash = await authUtils.hashPassword('CorrectPassword123');
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'doc-1',
        email: 'doc@consultorio.com',
        password: hash,
      });

      await expect(
        service.login({
          email: 'doc@consultorio.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });
  });

  describe('getCurrentUser', () => {
    it('obtiene el usuario actual si el token es válido y existe en la base de datos', async () => {
      const token = authUtils.generateToken({
        userId: 'doc-uuid-1',
        email: 'doc@consultorio.com',
        rol: 'ODONTOLOGO',
      });

      const mockUser = {
        id: 'doc-uuid-1',
        email: 'doc@consultorio.com',
        nombre: 'Dr. Soto',
        especialidad: 'Odontología',
        rol: 'ODONTOLOGO',
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const user = await service.getCurrentUser(token);
      expect(user).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'doc-uuid-1' },
        select: {
          id: true,
          email: true,
          nombre: true,
          especialidad: true,
          rol: true,
        },
      });
    });

    it('lanza INVALID_OR_EXPIRED_TOKEN si el token es inválido', async () => {
      await expect(service.getCurrentUser('token.invalido.123')).rejects.toThrow(
        'INVALID_OR_EXPIRED_TOKEN'
      );
    });

    it('lanza USER_NOT_FOUND si el usuario del token ya no existe en la base de datos', async () => {
      const token = authUtils.generateToken({
        userId: 'deleted-user-id',
        email: 'deleted@consultorio.com',
        rol: 'ODONTOLOGO',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentUser(token)).rejects.toThrow('USER_NOT_FOUND');
    });
  });
});
