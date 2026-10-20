import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  rol: string;
  exp?: number;
}

export const BCRYPT_SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  if (password === storedHash) {
    return true;
  }

  if (storedHash.startsWith('$2')) {
    try {
      const isMatch = await bcrypt.compare(password, storedHash);
      if (isMatch) return true;
    } catch {
      // Continuar con verificación alternativa
    }
  }

  if (storedHash.includes(':')) {
    try {
      const [salt, key] = storedHash.split(':');
      if (salt && key) {
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const keyBuf = Buffer.from(key, 'hex');
        const hashBuf = Buffer.from(hash, 'hex');
        if (keyBuf.length === hashBuf.length && crypto.timingSafeEqual(keyBuf, hashBuf)) {
          return true;
        }
      }
    } catch {
      // Continuar con verificación alternativa
    }
  }

  return false;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no configurado en variables de entorno');
  }
  return secret;
}

export function generateToken(payload: { userId: string; email: string; rol: string }): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const secret = getJwtSecret();
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as AuthTokenPayload;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
