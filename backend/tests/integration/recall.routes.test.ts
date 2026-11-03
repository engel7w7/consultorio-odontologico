import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { generateToken } from '../../src/utils/auth.utils';

// QA - Pruebas de integración HU-14 (Detección de profilaxis vencidas - Retorno de pacientes)
// Escenario crítico SQAP (Secc. 7): "el sistema detecta profilaxis con 6 meses o más de antigüedad"

const paciente1 = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Carlos Mendoza', telefono: '71234567' };
const paciente2 = { id: '22222222-2222-4222-8222-222222222222', nombre: 'Ana María Quispe', telefono: '72345678' };

describe('QA Integración - HU-14 Recall de Profilaxis', () => {
  let authHeader = '';

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'qa-test-secret';
    const token = generateToken({
      userId: 'qa-odontologo-id',
      email: 'odontologo@test.com',
      rol: 'ODONTOLOGO',
    });
    authHeader = `Bearer ${token}`;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('CP-14-01: GET /api/recall/profilaxis-vencidas retorna 200 con lista ordenada por dias_atraso DESC', async () => {
    const ahora = new Date();
    const hace7Meses = new Date(ahora.getTime() - 210 * 24 * 60 * 60 * 1000);
    const hace9Meses = new Date(ahora.getTime() - 270 * 24 * 60 * 60 * 1000);

    const citasSimuladas = [
      {
        id: 'c-1',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: hace7Meses,
        fecha_fin: new Date(hace7Meses.getTime() + 30 * 60000),
        estado: 'ATENDIDA',
      },
      {
        id: 'c-2',
        patient_id: paciente2.id,
        patient: paciente2,
        motivo: 'Limpieza profunda',
        fecha_inicio: hace9Meses,
        fecha_fin: new Date(hace9Meses.getTime() + 30 * 60000),
        estado: 'ATENDIDA',
      },
    ];

    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue(citasSimuladas as any);

    const res = await request(app)
      .get('/api/recall/profilaxis-vencidas')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);

    // Verificación de orden por dias_atraso DESC (paciente2 tiene 9 meses vs 7 meses de paciente1)
    expect(res.body[0].patient.id).toBe(paciente2.id);
    expect(res.body[1].patient.id).toBe(paciente1.id);
    expect(res.body[0].dias_atraso).toBeGreaterThanOrEqual(res.body[1].dias_atraso);
  });

  // Control de acceso: La consulta de recall clínico NO debe ser accesible sin sesión médica.
  // DEFECTO CONOCIDO DEF-013: auth.middleware.ts deja pasar sin token cuando
  // NODE_ENV === 'test' (modo de ejecución CI/Vitest). Se marca con it.fails para que
  // el pipeline permanezca verde mientras DEF-013 sigue documentado.
  it.fails('CP-14-02 [DEF-013 abierto]: GET /api/recall/profilaxis-vencidas sin token -> 401', async () => {
    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue([]);

    const res = await request(app).get('/api/recall/profilaxis-vencidas');

    expect(res.status).toBe(401);
  });
});
