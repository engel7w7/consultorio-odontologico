import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/prisma';
import { generateToken } from '../../src/utils/auth.utils';

// QA - Pruebas de integración HU-12 (Buscador de pacientes por nombre o teléfono)
// Escenario crítico SQAP (Secc. 7): "la búsqueda retorna al paciente correcto
// dentro del tiempo objetivo" (tiempo: JMeter p95 <= 2 s).

const ana = { id: 'p-1', nombre: 'Ana María Quispe', telefono: '72345678' };

describe('QA Integración - HU-12 Buscador de pacientes', () => {
  let auth = '';
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'qa-test-secret';
    auth = `Bearer ${generateToken({ userId: 'qa-user', email: 'qa@test.com', rol: 'ODONTOLOGO' })}`;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const buscar = (q?: string) =>
    request(app)
      .get(q === undefined ? '/api/patients' : `/api/patients?search=${encodeURIComponent(q)}`)
      .set('Authorization', auth);

  const filtroDe = (spy: ReturnType<typeof vi.spyOn>) => (spy.mock.calls[0][0] as any).where ?? {};

  it('CP-12-01: buscar por nombre filtra por nombre sin distinguir mayúsculas', async () => {
    const spy = vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([ana] as any);

    const res = await buscar('ana maría');

    expect(res.status).toBe(200);
    expect(res.body[0].nombre).toBe('Ana María Quispe');
    expect(filtroDe(spy).OR).toContainEqual({ nombre: { contains: 'ana maría', mode: 'insensitive' } });
  });

  it('CP-12-02: buscar por teléfono filtra por teléfono', async () => {
    const spy = vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([ana] as any);

    const res = await buscar('7234');

    expect(res.status).toBe(200);
    expect(filtroDe(spy).OR).toContainEqual({ telefono: { contains: '7234' } });
  });

  it('CP-12-03: espacios al inicio/fin se ignoran', async () => {
    const spy = vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([] as any);

    await buscar('   Ana   ');

    expect(filtroDe(spy).OR).toContainEqual({ nombre: { contains: 'Ana', mode: 'insensitive' } });
  });

  it.each([undefined, '', '   '])('CP-12-04: búsqueda vacía (%o) devuelve todos sin filtro', async (q) => {
    const spy = vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([ana] as any);

    const res = await buscar(q);

    expect(res.status).toBe(200);
    expect(filtroDe(spy).OR).toBeUndefined();
  });

  it('CP-12-05: sin resultados -> 200 con lista vacía', async () => {
    vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([] as any);

    const res = await buscar('Zzzz');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("CP-12-06: caracteres especiales (O'Brien, %, _) no rompen la búsqueda", async () => {
    vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([] as any);

    for (const q of ["O'Brien", '100%', 'a_b', 'Ñandú']) {
      const res = await buscar(q);
      expect(res.status).toBe(200);
    }
  });

  it('CP-12-07: búsqueda de más de 100 caracteres -> 400', async () => {
    const spy = vi.spyOn(prisma.patient, 'findMany');

    const res = await buscar('a'.repeat(101));

    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });
});
