import { describe, it, expect } from 'vitest';
import {
  esProfilaxis,
  sumarMesesCalendario,
  evaluarProfilaxisVencidas,
  CitaParaRecall,
} from '../../src/utils/recall.utils';

describe('HU-14 Recall Utils - esProfilaxis', () => {
  it('detecta correctamente motivos positivos de profilaxis', () => {
    expect(esProfilaxis('Profilaxis y destartraje dental')).toBe(true);
    expect(esProfilaxis('Profilaxis dental')).toBe(true);
    expect(esProfilaxis('Limpieza dental y pulido')).toBe(true);
    expect(esProfilaxis('Destartraje supragingival')).toBe(true);
    expect(esProfilaxis('Tartrectomía')).toBe(true);
    expect(esProfilaxis('LIMPIEZA DENTAL PROFUNDA')).toBe(true);
  });

  it('rechaza motivos que no son profilaxis', () => {
    expect(esProfilaxis('Extracción de tercer molar')).toBe(false);
    expect(esProfilaxis('Restauración con resina compuesta')).toBe(false);
    expect(esProfilaxis('Tratamiento de conducto (Endodoncia)')).toBe(false);
    expect(esProfilaxis('Consulta médica odontológica general')).toBe(false);
    expect(esProfilaxis('')).toBe(false);
  });
});

describe('HU-14 Recall Utils - sumarMesesCalendario', () => {
  it('ajusta 31/08/2026 a 28/02/2027 en año no bisiesto', () => {
    const fecha = new Date(2026, 7, 31); // 31 de agosto de 2026
    const res = sumarMesesCalendario(fecha, 6);
    expect(res.getFullYear()).toBe(2027);
    expect(res.getMonth()).toBe(1); // Febrero
    expect(res.getDate()).toBe(28);
  });

  it('ajusta 31/08/2023 a 29/02/2024 en año bisiesto', () => {
    const fecha = new Date(2023, 7, 31); // 31 de agosto de 2023
    const res = sumarMesesCalendario(fecha, 6);
    expect(res.getFullYear()).toBe(2024);
    expect(res.getMonth()).toBe(1); // Febrero
    expect(res.getDate()).toBe(29);
  });

  it('maneja el cambio de año (15/07 -> 15/01)', () => {
    const fecha = new Date(2026, 6, 15); // 15 de julio de 2026
    const res = sumarMesesCalendario(fecha, 6);
    expect(res.getFullYear()).toBe(2027);
    expect(res.getMonth()).toBe(0); // Enero
    expect(res.getDate()).toBe(15);
  });

  it('ajusta fin de mes de 31 días a mes de 30 días (31/03 -> 30/09)', () => {
    const fecha = new Date(2026, 2, 31); // 31 de marzo de 2026
    const res = sumarMesesCalendario(fecha, 6);
    expect(res.getFullYear()).toBe(2026);
    expect(res.getMonth()).toBe(8); // Septiembre
    expect(res.getDate()).toBe(30);
  });
});

describe('HU-14 Recall Utils - evaluarProfilaxisVencidas', () => {
  const paciente1 = { id: 'p-1', nombre: 'Carlos Ramos', telefono: '71111111' };
  const paciente2 = { id: 'p-2', nombre: 'Lucía Méndez', telefono: '72222222' };
  const paciente3 = { id: 'p-3', nombre: 'Andrés Flores', telefono: '73333333' };

  it('detecta profilaxis con exactamente 6 meses de antigüedad (vencida hoy, dias_atraso = 0)', () => {
    const hoy = new Date(2026, 10, 3, 10, 0, 0); // 3 de noviembre de 2026
    const haceSeisMesesExactos = new Date(2026, 4, 3, 10, 0, 0); // 3 de mayo de 2026

    const citas: CitaParaRecall[] = [
      {
        id: 'c-1',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: haceSeisMesesExactos,
        fecha_fin: new Date(2026, 4, 3, 10, 30, 0),
        estado: 'ATENDIDA',
      },
    ];

    const resultado = evaluarProfilaxisVencidas(citas, hoy);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].patient.id).toBe(paciente1.id);
    expect(resultado[0].dias_atraso).toBe(0);
    expect(resultado[0].reagendado).toBe(false);
  });

  it('no incluye profilaxis con 5 meses y 29 días (no vencida aún)', () => {
    const hoy = new Date(2026, 10, 3, 10, 0, 0); // 3 de noviembre de 2026
    const fechaCincoMeses29Dias = new Date(2026, 4, 5, 10, 0, 0); // 5 de mayo de 2026 (vence el 5 de nov)

    const citas: CitaParaRecall[] = [
      {
        id: 'c-2',
        patient_id: paciente2.id,
        patient: paciente2,
        motivo: 'Limpieza dental',
        fecha_inicio: fechaCincoMeses29Dias,
        fecha_fin: new Date(2026, 4, 5, 10, 30, 0),
        estado: 'ATENDIDA',
      },
    ];

    const resultado = evaluarProfilaxisVencidas(citas, hoy);
    expect(resultado).toHaveLength(0);
  });

  it('ignora pacientes cuyas citas atendidas no sean profilaxis', () => {
    const hoy = new Date(2026, 10, 3, 10, 0, 0);
    const citas: CitaParaRecall[] = [
      {
        id: 'c-extraccion',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Extracción de tercer molar',
        fecha_inicio: new Date(2026, 2, 1),
        fecha_fin: new Date(2026, 2, 1),
        estado: 'ATENDIDA',
      },
    ];

    const resultado = evaluarProfilaxisVencidas(citas, hoy);
    expect(resultado).toHaveLength(0);
  });

  it('usa la ÚLTIMA profilaxis atendida si el paciente tiene varias', () => {
    const hoy = new Date(2026, 10, 3, 10, 0, 0);
    const profilaxisAntigua = new Date(2025, 5, 1, 10, 0, 0); // 1 año atrás
    const profilaxisReciente = new Date(2026, 8, 1, 10, 0, 0); // 2 meses atrás

    const citas: CitaParaRecall[] = [
      {
        id: 'c-antigua',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: profilaxisAntigua,
        fecha_fin: new Date(2025, 5, 1, 10, 30, 0),
        estado: 'ATENDIDA',
      },
      {
        id: 'c-reciente',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Limpieza dental',
        fecha_inicio: profilaxisReciente,
        fecha_fin: new Date(2026, 8, 1, 10, 30, 0),
        estado: 'ATENDIDA',
      },
    ];

    const resultado = evaluarProfilaxisVencidas(citas, hoy);
    // Como la más reciente fue hace solo 2 meses, no debe estar vencida
    expect(resultado).toHaveLength(0);
  });

  it('ignora citas PROGRAMADA y CANCELADA para el cálculo de última profilaxis', () => {
    const hoy = new Date(2026, 10, 3, 10, 0, 0);
    const hace7Meses = new Date(2026, 3, 1, 10, 0, 0);

    const citas: CitaParaRecall[] = [
      {
        id: 'c-atendida',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: hace7Meses,
        fecha_fin: new Date(2026, 3, 1, 10, 30, 0),
        estado: 'ATENDIDA',
      },
      {
        id: 'c-programada-antigua',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Limpieza dental',
        fecha_inicio: new Date(2026, 8, 1),
        fecha_fin: new Date(2026, 8, 1),
        estado: 'CANCELADA',
      },
    ];

    const resultado = evaluarProfilaxisVencidas(citas, hoy);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].ultima_profilaxis).toEqual(hace7Meses);
  });

  it('marca reagendado = true y asigna proxima_cita si tiene cita futura programada', () => {
    const hoy = new Date(2026, 10, 3, 10, 0, 0);
    const hace8Meses = new Date(2026, 2, 1, 10, 0, 0);
    const citaFutura = new Date(2026, 10, 15, 14, 0, 0);

    const citas: CitaParaRecall[] = [
      {
        id: 'c-antigua',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: hace8Meses,
        fecha_fin: new Date(2026, 2, 1, 10, 30, 0),
        estado: 'ATENDIDA',
      },
      {
        id: 'c-futura',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: citaFutura,
        fecha_fin: new Date(2026, 10, 15, 14, 30, 0),
        estado: 'PROGRAMADA',
      },
    ];

    const resultado = evaluarProfilaxisVencidas(citas, hoy);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].reagendado).toBe(true);
    expect(resultado[0].proxima_cita).toEqual(citaFutura);
  });

  it('ordena la lista por dias_atraso DESC', () => {
    const hoy = new Date(2026, 10, 3, 10, 0, 0);
    const hace7Meses = new Date(2026, 3, 3, 10, 0, 0); // Venció hace ~31 días
    const hace9Meses = new Date(2026, 1, 3, 10, 0, 0); // Venció hace ~90 días

    const citas: CitaParaRecall[] = [
      {
        id: 'c-p1',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: hace7Meses,
        fecha_fin: hace7Meses,
        estado: 'ATENDIDA',
      },
      {
        id: 'c-p3',
        patient_id: paciente3.id,
        patient: paciente3,
        motivo: 'Limpieza dental',
        fecha_inicio: hace9Meses,
        fecha_fin: hace9Meses,
        estado: 'ATENDIDA',
      },
    ];

    const resultado = evaluarProfilaxisVencidas(citas, hoy);
    expect(resultado).toHaveLength(2);
    expect(resultado[0].patient.id).toBe(paciente3.id);
    expect(resultado[1].patient.id).toBe(paciente1.id);
    expect(resultado[0].dias_atraso).toBeGreaterThan(resultado[1].dias_atraso);
  });
});

