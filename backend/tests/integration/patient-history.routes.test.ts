import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { generateToken } from '../../src/utils/auth.utils';

// Pruebas de integración HU-10 (Historial cronológico de tratamientos)
// Escenario crítico SQAP: "el historial cronológico de tratamientos se lista en orden por paciente".
// Métrica de Fiabilidad: 0 mezcla de datos entre pacientes.

const PATIENT_ID = '11111111-1111-4111-8111-111111111111';
const OTRO_PATIENT_ID = '22222222-2222-4222-8222-222222222222';

const paciente = {
  id: PATIENT_ID,
  nombre: 'Ana Prueba',
  edad: 34,
  telefono: '70000001',
};

const cita = (id: string, patientId: string, motivo: string, inicio: string, fin: string) => ({
  id,
  patient_id: patientId,
  motivo,
  fecha_inicio: new Date(inicio),
  fecha_fin: new Date(fin),
  estado: 'ATENDIDA',
});

const citasAna = [
  cita('c-3', PATIENT_ID, 'Endodoncia', '2026-10-15T14:00:00.000Z', '2026-10-15T15:30:00.000Z'),
  cita('c-2', PATIENT_ID, 'Obturación', '2026-09-20T14:00:00.000Z', '2026-09-20T14:45:00.000Z'),
  cita('c-1', PATIENT_ID, 'Limpieza dental', '2026-08-01T14:00:00.000Z', '2026-08-01T14:30:00.000Z'),
];

const citaDeOtroPaciente = cita(
  'x-1',
  OTRO_PATIENT_ID,
  'Extracción de otro paciente',
  '2026-10-01T14:00:00.000Z',
  '2026-10-01T15:00:00.000Z'
);

describe('QA Integración - HU-10 Historial cronológico de tratamientos', () => {
  let token: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = 'test-secret-integration-jwt';
    token = generateToken({ userId: 'doc-1', email: 'doctor@consultorio.com', rol: 'ODONTOLOGO' });
  });

  const getHistory = (id: string, query = '') =>
    request(app)
      .get(`/api/patients/${id}/history${query}`)
      .set('Authorization', `Bearer ${token}`);

  it('CP-10-01: 200 con tratamientos en orden desc (más reciente primero)', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(paciente as any);
    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue(citasAna as any);

    const res = await getHistory(PATIENT_ID);

    expect(res.status).toBe(200);
    expect(res.body.patient).toEqual(paciente);
    expect(res.body.total).toBe(3);
    expect(res.body.tratamientos.map((t: { procedimiento: string }) => t.procedimiento)).toEqual([
      'Endodoncia',
      'Obturación',
      'Limpieza dental',
    ]);
    expect(res.body.tratamientos[0]).toEqual({
      id: 'c-3',
      fecha: '2026-10-15T14:00:00.000Z',
      procedimiento: 'Endodoncia',
      duracion_minutos: 90,
    });
  });

  it('CP-10-02: ?orden=asc consulta en orden ascendente', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(paciente as any);
    const findMany = vi
      .spyOn(prisma.appointment, 'findMany')
      .mockResolvedValue([...citasAna].reverse() as any);

    const res = await getHistory(PATIENT_ID, '?orden=asc');

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ fecha_inicio: 'asc' }, { id: 'asc' }] })
    );
    expect(res.body.tratamientos[0].procedimiento).toBe('Limpieza dental');
  });

  it('CP-10-03: NO MEZCLA - findMany filtra por el patient_id solicitado y solo ATENDIDAS', async () => {
    // "Base de datos" simulada con citas de dos pacientes y distintos estados:
    // el mock aplica el where real, así que una consulta sin filtro mezclaría datos.
    const tablaCitas = [
      ...citasAna,
      citaDeOtroPaciente,
      { ...citasAna[0], id: 'c-prog', estado: 'PROGRAMADA' },
      { ...citasAna[0], id: 'c-canc', estado: 'CANCELADA' },
    ];
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(paciente as any);
    const findMany = vi
      .spyOn(prisma.appointment, 'findMany')
      .mockImplementation(((args: { where: { patient_id?: string; estado?: string } }) =>
        Promise.resolve(
          tablaCitas.filter(
            (c) =>
              (!args.where.patient_id || c.patient_id === args.where.patient_id) &&
              (!args.where.estado || c.estado === args.where.estado)
          )
        )) as any);

    const res = await getHistory(PATIENT_ID);

    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patient_id: PATIENT_ID, estado: 'ATENDIDA' } })
    );
    const ids = res.body.tratamientos.map((t: { id: string }) => t.id);
    expect(ids).toEqual(['c-3', 'c-2', 'c-1']);
    expect(ids).not.toContain('x-1');
    expect(ids).not.toContain('c-prog');
    expect(ids).not.toContain('c-canc');
  });

  it('CP-10-04: paciente sin tratamientos -> 200 con lista vacía', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(paciente as any);
    vi.spyOn(prisma.appointment, 'findMany').mockResolvedValue([]);

    const res = await getHistory(PATIENT_ID);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.tratamientos).toEqual([]);
  });

  it('CP-10-05: paciente inexistente -> 404 y no consulta citas', async () => {
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue(null);
    const findMany = vi.spyOn(prisma.appointment, 'findMany');

    const res = await getHistory(PATIENT_ID);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Paciente no encontrado');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('CP-10-06: id que no es UUID -> 400', async () => {
    const findUnique = vi.spyOn(prisma.patient, 'findUnique');

    const res = await getHistory('no-es-uuid');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ID de paciente debe ser un UUID válido');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('CP-10-07: orden inválido -> 400', async () => {
    const res = await getHistory(PATIENT_ID, '?orden=xyz');

    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
  });

  it('CP-10-08: sin token -> 401 (requireAuth fuera del modo test)', async () => {
    // requireAuth deja pasar peticiones sin cabecera cuando NODE_ENV=test,
    // por eso se simula un entorno real solo durante esta prueba.
    const originalEnv = process.env.NODE_ENV;
    const findUnique = vi.spyOn(prisma.patient, 'findUnique');
    try {
      process.env.NODE_ENV = 'development';
      const res = await request(app).get(`/api/patients/${PATIENT_ID}/history`);

      expect(res.status).toBe(401);
      expect(findUnique).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('CP-10-09: token inválido -> 401', async () => {
    const findUnique = vi.spyOn(prisma.patient, 'findUnique');

    const res = await request(app)
      .get(`/api/patients/${PATIENT_ID}/history`)
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
