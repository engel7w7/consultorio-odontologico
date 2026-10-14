import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDayRangeUTC, getTodayDateStringLaPaz } from '../../src/utils/date.utils';

describe('QA Unit Tests: date.utils (HU-04)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDayRangeUTC', () => {
    it('debe calcular el rango UTC correcto para una fecha específica (2026-10-13)', () => {
      const { start, end } = getDayRangeUTC('2026-10-13');

      expect(start.toISOString()).toBe('2026-10-13T04:00:00.000Z');
      expect(end.toISOString()).toBe('2026-10-14T04:00:00.000Z');
    });

    it('debe manejar correctamente el cambio de mes a fin de octubre (2026-10-31)', () => {
      const { start, end } = getDayRangeUTC('2026-10-31');

      expect(start.toISOString()).toBe('2026-10-31T04:00:00.000Z');
      expect(end.toISOString()).toBe('2026-11-01T04:00:00.000Z');
    });

    it('debe manejar correctamente el cambio de año a fin de diciembre (2026-12-31)', () => {
      const { start, end } = getDayRangeUTC('2026-12-31');

      expect(start.toISOString()).toBe('2026-12-31T04:00:00.000Z');
      expect(end.toISOString()).toBe('2027-01-01T04:00:00.000Z');
    });

    it('una cita a las 23:30 de La Paz (2026-10-14T03:30:00Z) debe quedar dentro del rango del 13', () => {
      const { start, end } = getDayRangeUTC('2026-10-13');
      const citaDate = new Date('2026-10-14T03:30:00.000Z');

      const estaDentro = citaDate.getTime() >= start.getTime() && citaDate.getTime() < end.getTime();
      expect(estaDentro).toBe(true);
    });

    it('sin parámetro, debe usar el día actual de La Paz', () => {
      // 2026-10-14 02:00:00 UTC equivale a 2026-10-13 22:00:00 en La Paz (UTC-4)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-14T02:00:00.000Z'));

      const { start, end } = getDayRangeUTC();

      expect(start.toISOString()).toBe('2026-10-13T04:00:00.000Z');
      expect(end.toISOString()).toBe('2026-10-14T04:00:00.000Z');
    });
  });

  describe('getTodayDateStringLaPaz', () => {
    it('debe devolver la fecha local en formato YYYY-MM-DD para una fecha inyectada', () => {
      // 2026-10-14 02:30 UTC -> 2026-10-13 22:30 en La Paz
      const lateNightUTC = new Date('2026-10-14T02:30:00.000Z');
      expect(getTodayDateStringLaPaz(lateNightUTC)).toBe('2026-10-13');

      // 2026-10-14 05:00 UTC -> 2026-10-14 01:00 en La Paz
      const morningUTC = new Date('2026-10-14T05:00:00.000Z');
      expect(getTodayDateStringLaPaz(morningUTC)).toBe('2026-10-14');
    });

    it('sin parámetros usa la fecha actual del sistema', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-20T16:00:00.000Z')); // 12:00 en La Paz
      expect(getTodayDateStringLaPaz()).toBe('2026-05-20');
    });
  });
});
