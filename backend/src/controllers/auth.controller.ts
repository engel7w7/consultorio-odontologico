import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { loginSchema } from '../schemas/auth.schema.js';
import { z } from 'zod';

export class AuthController {
  constructor(private service: AuthService) {}

  login = async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await this.service.login(parsed);
      return res.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Datos de inicio de sesión inválidos',
          issues: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          error: 'Credenciales inválidas. Verifique su correo o contraseña.',
        });
      }

      console.error('Error en autenticación médica:', error);
      return res.status(500).json({ error: 'Error interno en el servidor de autenticación' });
    }
  };

  me = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Sesión no iniciada o token no provisto' });
      }

      const token = authHeader.split(' ')[1];
      const user = await this.service.getCurrentUser(token);
      return res.status(200).json(user);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message === 'INVALID_OR_EXPIRED_TOKEN' || error.message === 'USER_NOT_FOUND')
      ) {
        return res.status(401).json({ error: 'Sesión expirada o inválida' });
      }

      console.error('Error al obtener usuario actual:', error);
      return res.status(500).json({ error: 'Error interno al verificar la sesión' });
    }
  };
}
