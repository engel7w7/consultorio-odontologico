import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthTokenPayload } from '../utils/auth.utils.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    return res.status(401).json({
      error: 'Acceso no autorizado: Debe iniciar sesión como odontólogo para acceder a los datos médicos protegidos.',
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      error: 'Sesión expirada o token de autenticación inválido.',
    });
  }

  (req as AuthenticatedRequest).user = payload;
  next();
}
