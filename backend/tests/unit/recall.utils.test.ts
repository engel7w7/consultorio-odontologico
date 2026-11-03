import { describe, it, expect } from 'vitest';
import {
  esProfilaxis,
  sumarMesesCalendario,
  evaluarProfilaxisVencidas,
  evaluarRetornoMensual,
  calcularPrioridad,
  calcularIngresoEstimadoProfilaxis,
  parseMonto,
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

describe('HU-15 Recall Utils - parseMonto', () => {
  it('convierte montos number, string, objeto Decimal o null a number', () => {
    expect(parseMonto(150)).toBe(150);
    expect(parseMonto('150.50')).toBe(150.5);
    expect(parseMonto({ toNumber: () => 200 })).toBe(200);
    expect(parseMonto(null)).toBe(0);
    expect(parseMonto(undefined)).toBe(0);
    expect(parseMonto('invalido')).toBe(0);
  });
});

describe('HU-15 Recall Utils - calcularPrioridad', () => {
  it('calcula puntaje de atraso proporcional con tope en 6 meses (60 puntos)', () => {
    // 0 días de atraso
    const p0 = calcularPrioridad(0, 0, 0);
    expect(p0.prioridad).toBe(0);
    expect(p0.motivos).toContain('Sin atraso acumulado');

    // 3 meses de atraso (~90 días) -> ~30 puntos
    const p3m = calcularPrioridad(90, 0, 0);
    expect(p3m.prioridad).toBe(30);
    expect(p3m.motivos).toContain('3 meses de atraso');

    // 6 meses de atraso (180 días) -> 60 puntos
    const p6m = calcularPrioridad(180, 0, 0);
    expect(p6m.prioridad).toBe(60);
    expect(p6m.motivos).toContain('6 meses de atraso');

    // 10 meses de atraso (300 días) -> tope 60 puntos
    const p10m = calcularPrioridad(300, 0, 0);
    expect(p10m.prioridad).toBe(60);
    expect(p10m.motivos).toContain('10 meses de atraso');
  });

  it('calcula puntaje de visitas del último año con tope en 4 visitas (20 puntos)', () => {
    const p1v = calcularPrioridad(0, 1, 0);
    expect(p1v.prioridad).toBe(5);
    expect(p1v.motivos).toContain('1 visita en el último año');

    const p2v = calcularPrioridad(0, 2, 0);
    expect(p2v.prioridad).toBe(10);
    expect(p2v.motivos).toContain('2 visitas en el último año');

    const p4v = calcularPrioridad(0, 4, 0);
    expect(p4v.prioridad).toBe(20);
    expect(p4v.motivos).toContain('4 visitas en el último año');

    const p8v = calcularPrioridad(0, 8, 0);
    expect(p8v.prioridad).toBe(20);
    expect(p8v.motivos).toContain('8 visitas en el último año');
  });

  it('calcula puntaje de total cobrado histórico con tope en 500 Bs (20 puntos)', () => {
    const p250 = calcularPrioridad(0, 0, 250);
    expect(p250.prioridad).toBe(10);
    expect(p250.motivos).toContain('Bs 250.00 cobrados');

    const p500 = calcularPrioridad(0, 0, 500);
    expect(p500.prioridad).toBe(20);
    expect(p500.motivos).toContain('Bs 500.00 cobrados');

    const p1000 = calcularPrioridad(0, 0, 1000);
    expect(p1000.prioridad).toBe(20);
    expect(p1000.motivos).toContain('Bs 1000.00 cobrados');
  });

  it('suma las 3 dimensiones respetando el máximo total de 100 puntos y motivos legibles', () => {
    // 6 meses atraso (60) + 4 visitas (20) + 500 Bs (20) = 100
    const full = calcularPrioridad(180, 4, 500);
    expect(full.prioridad).toBe(100);
    expect(full.motivos).toHaveLength(3);
    expect(full.motivos).toEqual([
      '6 meses de atraso',
      '4 visitas en el último año',
      'Bs 500.00 cobrados',
    ]);
  });
});

describe('HU-15 Recall Utils - calcularIngresoEstimadoProfilaxis', () => {
  it('calcula el promedio de las profilaxis con cobro', () => {
    const citas: CitaParaRecall[] = [
      {
        id: 'c-1',
        patient_id: 'p-1',
        patient: { id: 'p-1', nombre: 'P1', telefono: '71111111' },
        motivo: 'Profilaxis dental',
        fecha_inicio: new Date(2025, 0, 1),
        fecha_fin: new Date(2025, 0, 1),
        estado: 'ATENDIDA',
        monto_pagado: 100,
      },
      {
        id: 'c-2',
        patient_id: 'p-1',
        patient: { id: 'p-1', nombre: 'P1', telefono: '71111111' },
        motivo: 'Limpieza dental y pulido',
        fecha_inicio: new Date(2025, 6, 1),
        fecha_fin: new Date(2025, 6, 1),
        estado: 'ATENDIDA',
        monto_pagado: 200,
      },
      {
        id: 'c-3',
        patient_id: 'p-1',
        patient: { id: 'p-1', nombre: 'P1', telefono: '71111111' },
        motivo: 'Extracción muela', // no es profilaxis
        fecha_inicio: new Date(2025, 8, 1),
        fecha_fin: new Date(2025, 8, 1),
        estado: 'ATENDIDA',
        monto_pagado: 500,
      },
    ];

    expect(calcularIngresoEstimadoProfilaxis(citas)).toBe(150);
  });

  it('retorna 0 si el paciente no tiene profilaxis con cobro', () => {
    const citas: CitaParaRecall[] = [
      {
        id: 'c-1',
        patient_id: 'p-1',
        patient: { id: 'p-1', nombre: 'P1', telefono: '71111111' },
        motivo: 'Profilaxis dental',
        fecha_inicio: new Date(2025, 0, 1),
        fecha_fin: new Date(2025, 0, 1),
        estado: 'ATENDIDA',
        monto_pagado: 0,
      },
    ];

    expect(calcularIngresoEstimadoProfilaxis(citas)).toBe(0);
    expect(calcularIngresoEstimadoProfilaxis([])).toBe(0);
  });
});

describe('HU-15 Recall Utils - evaluarRetornoMensual', () => {
  const paciente1 = { id: 'p-1', nombre: 'Carlos Ramos', telefono: '71111111' };
  const paciente2 = { id: 'p-2', nombre: 'Lucía Méndez', telefono: '72222222' };
  const paciente3 = { id: 'p-3', nombre: 'Andrés Flores', telefono: '73333333' };
  const pacienteReagendado = { id: 'p-4', nombre: 'Elena Prado', telefono: '74444444' };

  it('clasifica VENCE_ESTE_MES cuando la profilaxis vence en el mes consultado', () => {
    const hoy = new Date(2026, 10, 15, 10, 0, 0); // 15 de noviembre de 2026
    const hace6Meses = new Date(2026, 4, 15, 10, 0, 0); // 15 de mayo de 2026 -> vence 15 nov 2026

    const citas: CitaParaRecall[] = [
      {
        id: 'c-1',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: hace6Meses,
        fecha_fin: hace6Meses,
        estado: 'ATENDIDA',
        monto_pagado: 120,
      },
    ];

    const res = evaluarRetornoMensual(citas, '2026-11', hoy);
    expect(res.total).toBe(1);
    expect(res.pacientes[0].patient.id).toBe(paciente1.id);
    expect(res.pacientes[0].estado).toBe('VENCE_ESTE_MES');
    expect(res.pacientes[0].ingreso_estimado).toBe(120);
    expect(res.ingreso_estimado_total).toBe(120);
  });

  it('clasifica ATRASADO cuando venció en un mes anterior y aún no volvió', () => {
    const hoy = new Date(2026, 10, 15, 10, 0, 0); // Noviembre 2026
    const hace8Meses = new Date(2026, 2, 10, 10, 0, 0); // Marzo 2026 -> venció en Septiembre 2026

    const citas: CitaParaRecall[] = [
      {
        id: 'c-2',
        patient_id: paciente2.id,
        patient: paciente2,
        motivo: 'Limpieza dental',
        fecha_inicio: hace8Meses,
        fecha_fin: hace8Meses,
        estado: 'ATENDIDA',
        monto_pagado: 150,
      },
    ];

    const res = evaluarRetornoMensual(citas, '2026-11', hoy);
    expect(res.total).toBe(1);
    expect(res.pacientes[0].patient.id).toBe(paciente2.id);
    expect(res.pacientes[0].estado).toBe('ATRASADO');
  });

  it('excluye pacientes cuya profilaxis vence en un mes posterior', () => {
    const hoy = new Date(2026, 10, 15, 10, 0, 0); // Noviembre 2026
    const hace4Meses = new Date(2026, 6, 15, 10, 0, 0); // Julio 2026 -> vence en Enero 2027

    const citas: CitaParaRecall[] = [
      {
        id: 'c-3',
        patient_id: paciente3.id,
        patient: paciente3,
        motivo: 'Profilaxis dental',
        fecha_inicio: hace4Meses,
        fecha_fin: hace4Meses,
        estado: 'ATENDIDA',
        monto_pagado: 100,
      },
    ];

    const res = evaluarRetornoMensual(citas, '2026-11', hoy);
    expect(res.total).toBe(0);
    expect(res.pacientes).toHaveLength(0);
  });

  it('ESCENARIO CRÍTICO SQAP: la lista mensual de retorno no incluye pacientes ya reagendados', () => {
    const hoy = new Date(2026, 10, 15, 10, 0, 0); // 15 de noviembre de 2026
    const hace7Meses = new Date(2026, 3, 10, 10, 0, 0); // Abril 2026 -> venció en Octubre 2026 (ATRASADO)
    const citaFutura = new Date(2026, 10, 20, 14, 0, 0); // 20 de noviembre de 2026 (> hoy)

    const citas: CitaParaRecall[] = [
      {
        id: 'c-4-atendida',
        patient_id: pacienteReagendado.id,
        patient: pacienteReagendado,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: hace7Meses,
        fecha_fin: hace7Meses,
        estado: 'ATENDIDA',
        monto_pagado: 180,
      },
      {
        id: 'c-4-reagendada',
        patient_id: pacienteReagendado.id,
        patient: pacienteReagendado,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: citaFutura,
        fecha_fin: new Date(citaFutura.getTime() + 30 * 60000),
        estado: 'PROGRAMADA', // ¡Tiene cita futura programada!
      },
    ];

    const res = evaluarRetornoMensual(citas, '2026-11', hoy);
    // El paciente reagendado DEBE ser estrictamente excluido
    expect(res.total).toBe(0);
    expect(res.pacientes).toHaveLength(0);
    expect(res.ingreso_estimado_total).toBe(0);
  });

  it('ordena a los pacientes sugeridos por prioridad DESC', () => {
    const hoy = new Date(2026, 10, 15, 10, 0, 0); // 15 de noviembre de 2026
    // Paciente 1: Vence este mes (15 nov), poco atraso, 1 profilaxis previa de 100
    const fechaP1 = new Date(2026, 4, 15, 10, 0, 0);
    // Paciente 2: Venció hace 5 meses (junio), mucho atraso, profilaxis de 300, varias visitas
    const fechaP2 = new Date(2025, 11, 15, 10, 0, 0);

    const citas: CitaParaRecall[] = [
      {
        id: 'c-p1',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: fechaP1,
        fecha_fin: fechaP1,
        estado: 'ATENDIDA',
        monto_pagado: 100,
      },
      {
        id: 'c-p2',
        patient_id: paciente2.id,
        patient: paciente2,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: fechaP2,
        fecha_fin: fechaP2,
        estado: 'ATENDIDA',
        monto_pagado: 300,
      },
      {
        id: 'c-p2-v2',
        patient_id: paciente2.id,
        patient: paciente2,
        motivo: 'Curación',
        fecha_inicio: new Date(2026, 1, 10),
        fecha_fin: new Date(2026, 1, 10),
        estado: 'ATENDIDA',
        monto_pagado: 250,
      },
    ];

    const res = evaluarRetornoMensual(citas, '2026-11', hoy);
    expect(res.total).toBe(2);
    // Paciente 2 tiene más atraso, más visitas y más gasto histórico
    expect(res.pacientes[0].patient.id).toBe(paciente2.id);
    expect(res.pacientes[1].patient.id).toBe(paciente1.id);
    expect(res.pacientes[0].prioridad).toBeGreaterThan(res.pacientes[1].prioridad);
  });

  it('maneja correctamente los límites de zona horaria America/La_Paz (UTC-4)', () => {
    // 2026-12-01T03:30:00Z en UTC corresponde a las 23:30 del 30 de noviembre de 2026 en La Paz
    // Por tanto, en La Paz sigue siendo mes '2026-11'
    const fechaLimite = new Date('2026-12-01T03:30:00.000Z');
    // Para que venza el 2026-11-30, la profilaxis fue el 2026-05-30
    const fechaProfilaxis = new Date('2026-05-30T14:00:00.000Z');

    const citas: CitaParaRecall[] = [
      {
        id: 'c-lp',
        patient_id: paciente1.id,
        patient: paciente1,
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: fechaProfilaxis,
        fecha_fin: fechaProfilaxis,
        estado: 'ATENDIDA',
      },
    ];

    const res = evaluarRetornoMensual(citas, '2026-11', fechaLimite);
    expect(res.total).toBe(1);
    expect(res.pacientes[0].patient.id).toBe(paciente1.id);
    expect(res.pacientes[0].estado).toBe('VENCE_ESTE_MES');
  });
});
