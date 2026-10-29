import { describe, it, expect } from 'vitest';
import {
  normalizeWhatsAppPhone,
  buildWhatsAppReminderUrl,
} from '../../../frontend/src/utils/whatsapp.utils.js';

describe('QA Unit Tests: whatsapp.utils (HU-13)', () => {
  describe('normalizeWhatsAppPhone', () => {
    it('normaliza un número local boliviano de 8 dígitos agregando el prefijo 591', () => {
      const result = normalizeWhatsAppPhone('71234567');
      expect(result).toBe('59171234567');
    });

    it('respeta números que ya contienen el prefijo 591', () => {
      const result = normalizeWhatsAppPhone('59171234567');
      expect(result).toBe('59171234567');
    });

    it('elimina prefijo internacional 00', () => {
      const result = normalizeWhatsAppPhone('0059171234567');
      expect(result).toBe('59171234567');
    });

    it('elimina caracteres no numéricos (espacios, guiones, paréntesis)', () => {
      const result = normalizeWhatsAppPhone('+591 7123-4567');
      expect(result).toBe('59171234567');
    });

    it('retorna null para teléfonos con longitud inválida o vacíos', () => {
      expect(normalizeWhatsAppPhone('')).toBeNull();
      expect(normalizeWhatsAppPhone('1234')).toBeNull();
      expect(normalizeWhatsAppPhone('abcdefgh')).toBeNull();
    });
  });

  describe('buildWhatsAppReminderUrl', () => {
    it('genera la URL de wa.me con el número normalizado y el mensaje codificado', () => {
      const url = buildWhatsAppReminderUrl(
        '71234567',
        'Juan Pérez',
        '2026-10-30T14:30:00.000Z',
        'Endodoncia'
      );

      expect(url).not.toBeNull();
      expect(url).toContain('https://wa.me/59171234567?text=');
      const decoded = decodeURIComponent(url!);
      expect(decoded).toContain('Hola Juan Pérez');
      expect(decoded).toContain('Motivo: Endodoncia');
    });

    it('retorna null si el teléfono es inválido', () => {
      const url = buildWhatsAppReminderUrl(
        'invalido',
        'Juan Pérez',
        '2026-10-30T14:30:00.000Z',
        'Endodoncia'
      );

      expect(url).toBeNull();
    });
  });
});
