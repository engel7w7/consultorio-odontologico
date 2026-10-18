import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';

// QA - Pruebas de integración HU-08 (Alerta roja bloqueante de extracción)
// Plan SQAP: escenario crítico "intentar agendar una extracción sin exámenes
// dispara la alerta roja bloqueante". Severidad S1 si falla.

const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

const pacienteSinExamenes = {
  id: PATIENT_ID,
  nombre: 'Juan Pérez',
  examenes_sangre_validados: false,
};

const pacienteConExamenes = { ...pacienteSinExamenes, examenes_sangre_validados: true };

const cita = (motivo: string) => ({
  patient_id: PATIENT_ID,
  motivo,
  fecha_inicio: '2026-10-20T14:00:00.000Z',
  fecha_fin: '2026-10-20T15:00:00.000Z',
});

describe('QA Integración - HU-08 Alerta roja bloqueante', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('CP-08-01: extracción sin exámenes -> 422 y NO crea la cita', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(pacienteSinExamenes as any);
    const create = vi.spyOn(prisma.appointment, 'create').mockResolvedValue({} as any);

    const res = await request(app).post('/api/appointments').send(cita('Extracción de tercer molar'));

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('EXTRACTION_BLOOD_EXAMS_REQUIRED');
    expect(create).not.toHaveBeenCalled();
  });

  it('CP-08-02: extracción con exámenes validados -> 201', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(pacienteConExamenes as any);
    vi.spyOn(prisma.appointment, 'create').mockResolvedValue({ id: 'appt-1' } as any);

    const res = await request(app).post('/api/appointments').send(cita('Extracción de tercer molar'));

    expect(res.status).toBe(201);
  });

  it('CP-08-03: procedimiento que no es extracción, sin exámenes -> 201', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(pacienteSinExamenes as any);
    vi.spyOn(prisma.appointment, 'create').mockResolvedValue({ id: 'appt-2' } as any);

    const res = await request(app).post('/api/appointments').send(cita('Limpieza dental'));

    expect(res.status).toBe(201);
  });

  // Sinónimos reales de extracción: todos deben bloquear.
  it.each(['Exodoncia pieza 38', 'Procedimiento quirúrgico', 'Sacar muela del juicio'])(
    'CP-08-04: "%s" sin exámenes también debe bloquear',
    async (motivo) => {
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(pacienteSinExamenes as any);
      const create = vi.spyOn(prisma.appointment, 'create').mockResolvedValue({} as any);

      const res = await request(app).post('/api/appointments').send(cita(motivo));

      expect(create).not.toHaveBeenCalled();
      expect(res.status).toBe(422);
    }
  );

  it('CP-08-05: paciente inexistente -> 404', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);

    const res = await request(app).post('/api/appointments').send(cita('Limpieza dental'));

    expect(res.status).toBe(404);
  });

  it('CP-08-06: hora de fin anterior a la de inicio -> 400', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(pacienteConExamenes as any);
    const create = vi.spyOn(prisma.appointment, 'create').mockResolvedValue({} as any);

    const res = await request(app).post('/api/appointments').send({
      ...cita('Limpieza dental'),
      fecha_inicio: '2026-10-20T15:00:00.000Z',
      fecha_fin: '2026-10-20T14:00:00.000Z',
    });

    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
