import { describe, it, expect } from 'vitest';
import {
  getAppointmentsQuerySchema,
  registerPaymentSchema,
} from '../../src/schemas/appointment.schema.js';

describe('QA Unit Tests: appointment.schema (HU-04)', () => {
  it('debe validar exitosamente cuando se envía una fecha válida', () => {
    const result = getAppointmentsQuerySchema.safeParse({ date: '2026-10-13' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBe('2026-10-13');
    }
  });

  it('debe ser opcional y validar exitosamente sin parámetro de fecha', () => {
    const emptyObj = getAppointmentsQuerySchema.safeParse({});
    expect(emptyObj.success).toBe(true);

    const undefinedDate = getAppointmentsQuerySchema.safeParse({ date: undefined });
    expect(undefinedDate.success).toBe(true);
  });

  it('debe fallar si el formato no es YYYY-MM-DD (ej: 13-10-2026 o texto)', () => {
    const formatoInvertido = getAppointmentsQuerySchema.safeParse({ date: '13-10-2026' });
    expect(formatoInvertido.success).toBe(false);
    if (!formatoInvertido.success) {
      expect(formatoInvertido.error.issues[0].message).toBe('El formato de fecha debe ser YYYY-MM-DD');
    }

    const formatoBarras = getAppointmentsQuerySchema.safeParse({ date: '2026/10/13' });
    expect(formatoBarras.success).toBe(false);
    if (!formatoBarras.success) {
      expect(formatoBarras.error.issues[0].message).toBe('El formato de fecha debe ser YYYY-MM-DD');
    }

    const textoInvalido = getAppointmentsQuerySchema.safeParse({ date: 'invalido' });
    expect(textoInvalido.success).toBe(false);
  });

  it('debe fallar si la fecha es inexistente en el calendario (ej: 2026-02-30 o 2026-04-31)', () => {
    const febTreinta = getAppointmentsQuerySchema.safeParse({ date: '2026-02-30' });
    expect(febTreinta.success).toBe(false);
    if (!febTreinta.success) {
      expect(febTreinta.error.issues[0].message).toBe('Fecha inválida');
    }

    const abrTreintaYUno = getAppointmentsQuerySchema.safeParse({ date: '2026-04-31' });
    expect(abrTreintaYUno.success).toBe(false);
    if (!abrTreintaYUno.success) {
      expect(abrTreintaYUno.error.issues[0].message).toBe('Fecha inválida');
    }
  });
});

describe('QA Unit Tests: registerPaymentSchema (HU-11)', () => {
  it('valida exitosamente un monto entero o con decimales positivo', () => {
    const intVal = registerPaymentSchema.safeParse({ monto_pagado: 150 });
    expect(intVal.success).toBe(true);

    const decVal = registerPaymentSchema.safeParse({ monto_pagado: 180.75 });
    expect(decVal.success).toBe(true);
  });

  it('permite un monto de cero', () => {
    const zeroVal = registerPaymentSchema.safeParse({ monto_pagado: 0 });
    expect(zeroVal.success).toBe(true);
  });

  it('rechaza montos negativos', () => {
    const negVal = registerPaymentSchema.safeParse({ monto_pagado: -10 });
    expect(negVal.success).toBe(false);
    if (!negVal.success) {
      expect(negVal.error.issues[0].message).toBe('El monto no puede ser negativo');
    }
  });

  it('rechaza montos mayores al maximo permitido o no finitos', () => {
    const maxVal = registerPaymentSchema.safeParse({ monto_pagado: 100000000 });
    expect(maxVal.success).toBe(false);

    const infVal = registerPaymentSchema.safeParse({ monto_pagado: Infinity });
    expect(infVal.success).toBe(false);
  });

  it('rechaza valores no numericos o campos faltantes', () => {
    const strVal = registerPaymentSchema.safeParse({ monto_pagado: 'cien' });
    expect(strVal.success).toBe(false);

    const emptyVal = registerPaymentSchema.safeParse({});
    expect(emptyVal.success).toBe(false);
  });
});

