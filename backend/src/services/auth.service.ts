import { PrismaClient } from '@prisma/client';
import { verifyPassword, generateToken, verifyToken } from '../utils/auth.utils.js';
import { LoginInput } from '../schemas/auth.schema.js';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login(data: LoginInput) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isMatch = await verifyPassword(data.password, user.password);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        especialidad: user.especialidad,
        rol: user.rol,
      },
    };
  }

  async getCurrentUser(token: string) {
    const payload = verifyToken(token);
    if (!payload) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        especialidad: true,
        rol: true,
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }
}
