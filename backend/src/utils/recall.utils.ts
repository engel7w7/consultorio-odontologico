/**
 * Utilidades y reglas de negocio para el módulo de Retorno / Recall de Pacientes (HU-14 y HU-15).
 * Funciones puras y deterministas para facilitar pruebas unitarias.
 */
import { getYearMonthLaPaz } from './date.utils.js';

export interface CitaParaRecall {
  id: string;
  motivo: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: string;
  monto_pagado?: number | string | { toNumber(): number } | null;
  patient_id: string;
  patient: {
    id: string;
    nombre: string;
    telefono: string;
  };
}

export interface ProfilaxisVencidaItem {
  patient: {
    id: string;
    nombre: string;
    telefono: string;
  };
  ultima_profilaxis: Date;
  fecha_vencimiento: Date;
  dias_atraso: number;
  reagendado: boolean;
  proxima_cita: Date | null;
}

export interface PacienteRetornoItem {
  patient: {
    id: string;
    nombre: string;
    telefono: string;
  };
  ultima_profilaxis: Date;
  fecha_vencimiento: Date;
  estado: 'VENCE_ESTE_MES' | 'ATRASADO';
  prioridad: number;
  motivos: string[];
  ingreso_estimado: number;
}

export interface RetornoMensualResultado {
  mes: string;
  total: number;
  ingreso_estimado_total: number;
  pacientes: PacienteRetornoItem[];
}

export interface PrioridadInput {
  diasAtraso: number;
  visitasUltimos12Meses: number;
  totalCobradoHistorico: number;
  estado: 'VENCE_ESTE_MES' | 'ATRASADO';
}

export interface PrioridadResultado {
  prioridad: number;
  motivos: string[];
}

/**
 * Convierte montos (number, string o Decimal de Prisma) a número de punto flotante de forma segura.
 */
export function parseMonto(monto: unknown): number {
  if (monto === null || monto === undefined) return 0;
  if (typeof monto === 'number') return isNaN(monto) ? 0 : monto;
  if (
    typeof monto === 'object' &&
    monto !== null &&
    'toNumber' in monto &&
    typeof (monto as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (monto as { toNumber: () => number }).toNumber();
  }
  const parsed = parseFloat(String(monto));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Determina si el motivo de una cita corresponde a una profilaxis o limpieza dental.
 * Expresión regular: /profilaxis|limpieza|destartraje|tartrectom/i
 */
export function esProfilaxis(motivo: string): boolean {
  if (!motivo) return false;
  return /profilaxis|limpieza|destartraje|tartrectom/i.test(motivo);
}

/**
 * Suma N meses calendario a una fecha.
 * Si el día no existe en el mes destino, ajusta al último día válido de dicho mes
 * (ejemplo: 31/08 -> 28/02, o 29/02 en años bisiestos).
 */
export function sumarMesesCalendario(fecha: Date, meses = 6): Date {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const dia = fecha.getDate();

  const totalMeses = mes + meses;
  const nuevoAnio = anio + Math.floor(totalMeses / 12);
  const nuevoMes = ((totalMeses % 12) + 12) % 12;

  // El día 0 del mes siguiente retorna el último día del mes deseado
  const maxDiasEnNuevoMes = new Date(nuevoAnio, nuevoMes + 1, 0).getDate();
  const nuevoDia = Math.min(dia, maxDiasEnNuevoMes);

  const resultado = new Date(fecha.getTime());
  resultado.setFullYear(nuevoAnio, nuevoMes, nuevoDia);
  return resultado;
}

/**
 * Normaliza una fecha a la medianoche (00:00:00.000) local para comparaciones por día de calendario.
 */
export function normalizarMedianoche(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
}

/**
 * Calcula la prioridad (0 a 100) y la lista de motivos explicables para el odontólogo.
 * - atraso: hasta 60 pts (proporcional a los meses de atraso, tope en 6 meses).
 * - visitas atendidas en los últimos 12 meses: hasta 20 pts (5 pts por visita, tope 4 visitas).
 * - total cobrado histórico: hasta 20 pts (2 pts por cada Bs 50, tope Bs 500).
 */
export function calcularPrioridad(
  inputOrDiasAtraso: PrioridadInput | number,
  visitasParam?: number,
  totalCobradoParam?: number,
  estadoParam?: 'VENCE_ESTE_MES' | 'ATRASADO'
): PrioridadResultado {
  let diasAtraso: number;
  let visitasUltimos12Meses: number;
  let totalCobradoHistorico: number;
  let estado: 'VENCE_ESTE_MES' | 'ATRASADO' | undefined;

  if (typeof inputOrDiasAtraso === 'object' && inputOrDiasAtraso !== null) {
    diasAtraso = inputOrDiasAtraso.diasAtraso;
    visitasUltimos12Meses = inputOrDiasAtraso.visitasUltimos12Meses;
    totalCobradoHistorico = inputOrDiasAtraso.totalCobradoHistorico;
    estado = inputOrDiasAtraso.estado;
  } else {
    diasAtraso = inputOrDiasAtraso;
    visitasUltimos12Meses = visitasParam ?? 0;
    totalCobradoHistorico = totalCobradoParam ?? 0;
    estado = estadoParam;
  }

  const motivos: string[] = [];

  // 1. Atraso: hasta 60 puntos
  const mesesAtraso = Math.max(0, Math.floor(diasAtraso / 30));
  const puntosAtraso = Math.min(60, mesesAtraso * 10);

  if (mesesAtraso > 0) {
    motivos.push(`${mesesAtraso} ${mesesAtraso === 1 ? 'mes' : 'meses'} de atraso`);
  } else if (estado === 'VENCE_ESTE_MES') {
    motivos.push('Vence este mes');
  } else {
    motivos.push('Sin atraso acumulado');
  }

  // 2. Visitas en últimos 12 meses: hasta 20 puntos
  const puntosVisitas = Math.min(20, visitasUltimos12Meses * 5);
  if (visitasUltimos12Meses > 0) {
    motivos.push(
      `${visitasUltimos12Meses} ${
        visitasUltimos12Meses === 1 ? 'visita' : 'visitas'
      } en el último año`
    );
  }

  // 3. Total cobrado histórico: hasta 20 puntos
  const puntosCobrado = Math.min(20, Math.floor(totalCobradoHistorico / 50) * 2);
  if (totalCobradoHistorico > 0) {
    motivos.push(`Bs ${totalCobradoHistorico.toFixed(2)} cobrados`);
  }

  const prioridad = Math.min(100, Math.max(0, puntosAtraso + puntosVisitas + puntosCobrado));

  return { prioridad, motivos };
}

/**
 * Calcula el ingreso estimado de profilaxis como el promedio de monto_pagado de
 * sus profilaxis anteriores (retorna 0 si no tiene cobros registrados).
 */
export function calcularIngresoEstimadoProfilaxis(citas: CitaParaRecall[]): number {
  const cobros = citas
    .filter((c) => esProfilaxis(c.motivo))
    .map((c) => parseMonto(c.monto_pagado))
    .filter((m) => m > 0);

  if (cobros.length === 0) return 0;
  const suma = cobros.reduce((acc, val) => acc + val, 0);
  return Math.round((suma / cobros.length) * 100) / 100;
}

/**
 * Evalúa las citas históricas y detecta pacientes con profilaxis vencida (HU-14).
 */
export function evaluarProfilaxisVencidas(
  citas: CitaParaRecall[],
  hoy: Date = new Date()
): ProfilaxisVencidaItem[] {
  const citasPorPaciente = new Map<
    string,
    {
      patient: { id: string; nombre: string; telefono: string };
      citas: CitaParaRecall[];
    }
  >();

  for (const cita of citas) {
    const pId = cita.patient_id;
    if (!citasPorPaciente.has(pId)) {
      citasPorPaciente.set(pId, {
        patient: {
          id: cita.patient.id,
          nombre: cita.patient.nombre,
          telefono: cita.patient.telefono,
        },
        citas: [],
      });
    }
    citasPorPaciente.get(pId)!.citas.push(cita);
  }

  const hoyMedianoche = normalizarMedianoche(hoy);
  const resultado: ProfilaxisVencidaItem[] = [];

  for (const [, info] of citasPorPaciente.entries()) {
    const profilaxisAtendidas = info.citas
      .filter((c) => c.estado === 'ATENDIDA' && esProfilaxis(c.motivo))
      .sort((a, b) => b.fecha_inicio.getTime() - a.fecha_inicio.getTime());

    if (profilaxisAtendidas.length === 0) {
      continue;
    }

    const ultimaProfilaxisCita = profilaxisAtendidas[0];
    const ultimaFecha = new Date(ultimaProfilaxisCita.fecha_inicio);
    const fechaVencimiento = sumarMesesCalendario(ultimaFecha, 6);
    const vencimientoMedianoche = normalizarMedianoche(fechaVencimiento);

    if (hoyMedianoche.getTime() < vencimientoMedianoche.getTime()) {
      continue;
    }

    const diffMs = hoyMedianoche.getTime() - vencimientoMedianoche.getTime();
    const diasAtraso = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    const citasFuturas = info.citas
      .filter((c) => c.estado === 'PROGRAMADA' && new Date(c.fecha_inicio).getTime() > hoy.getTime())
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());

    const reagendado = citasFuturas.length > 0;
    const proximaCita = reagendado ? new Date(citasFuturas[0].fecha_inicio) : null;

    resultado.push({
      patient: info.patient,
      ultima_profilaxis: ultimaFecha,
      fecha_vencimiento: fechaVencimiento,
      dias_atraso: diasAtraso,
      reagendado,
      proxima_cita: proximaCita,
    });
  }

  return resultado.sort((a, b) => b.dias_atraso - a.dias_atraso);
}

/**
 * Evalúa y genera la lista mensual de retorno de pacientes sugeridos (HU-15).
 * Reglas:
 * 1. Incluye pacientes cuya fecha_vencimiento cae en el mes (VENCE_ESTE_MES)
 *    o en meses anteriores que aún no volvieron (ATRASADO).
 * 2. Excluye pacientes con fecha_vencimiento posterior al mes seleccionado.
 * 3. EXCLUYE SIEMPRE a pacientes con cita PROGRAMADA futura (ya reagendados).
 * 4. Calcula prioridad de 0 a 100 con motivos legibles e ingreso estimado.
 * 5. Ordenado por prioridad DESC.
 */
export function evaluarRetornoMensual(
  citas: CitaParaRecall[],
  mesFiltro?: string,
  hoy: Date = new Date()
): RetornoMensualResultado {
  const mes = mesFiltro || getYearMonthLaPaz(hoy);
  const hoyMedianoche = normalizarMedianoche(hoy);
  const unAñoAtras = new Date(hoy.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Agrupar citas por paciente
  const citasPorPaciente = new Map<
    string,
    {
      patient: { id: string; nombre: string; telefono: string };
      citas: CitaParaRecall[];
    }
  >();

  for (const cita of citas) {
    const pId = cita.patient_id;
    if (!citasPorPaciente.has(pId)) {
      citasPorPaciente.set(pId, {
        patient: {
          id: cita.patient.id,
          nombre: cita.patient.nombre,
          telefono: cita.patient.telefono,
        },
        citas: [],
      });
    }
    citasPorPaciente.get(pId)!.citas.push(cita);
  }

  const pacientes: PacienteRetornoItem[] = [];

  for (const [, info] of citasPorPaciente.entries()) {
    // Escenario crítico SQAP: EXCLUIR SIEMPRE pacientes ya reagendados (cita PROGRAMADA futura)
    const tieneCitaFutura = info.citas.some(
      (c) => c.estado === 'PROGRAMADA' && new Date(c.fecha_inicio).getTime() > hoy.getTime()
    );
    if (tieneCitaFutura) {
      continue;
    }

    // Filtrar profilaxis atendidas
    const profilaxisAtendidas = info.citas
      .filter((c) => c.estado === 'ATENDIDA' && esProfilaxis(c.motivo))
      .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());

    if (profilaxisAtendidas.length === 0) {
      continue;
    }

    const ultimaProfilaxisCita = profilaxisAtendidas[0];
    const ultimaFecha = new Date(ultimaProfilaxisCita.fecha_inicio);
    const fechaVencimiento = sumarMesesCalendario(ultimaFecha, 6);
    const mesVencimiento = getYearMonthLaPaz(fechaVencimiento);

    // Excluir si la fecha de vencimiento es posterior al mes solicitado
    if (mesVencimiento > mes) {
      continue;
    }

    let estado: 'VENCE_ESTE_MES' | 'ATRASADO';
    if (mesVencimiento === mes) {
      estado = 'VENCE_ESTE_MES';
    } else {
      estado = 'ATRASADO';
    }

    const vencimientoMedianoche = normalizarMedianoche(fechaVencimiento);
    const diffMs = hoyMedianoche.getTime() - vencimientoMedianoche.getTime();
    const diasAtraso = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Métricas para prioridad
    const citasAtendidas = info.citas.filter((c) => c.estado === 'ATENDIDA');
    const visitasUltimos12Meses = citasAtendidas.filter(
      (c) => new Date(c.fecha_inicio).getTime() >= unAñoAtras.getTime()
    ).length;

    const totalCobradoHistorico = citasAtendidas.reduce(
      (acc, c) => acc + parseMonto(c.monto_pagado),
      0
    );

    const { prioridad, motivos } = calcularPrioridad({
      diasAtraso,
      visitasUltimos12Meses,
      totalCobradoHistorico,
      estado,
    });

    const ingresoEstimado = calcularIngresoEstimadoProfilaxis(profilaxisAtendidas);

    pacientes.push({
      patient: info.patient,
      ultima_profilaxis: ultimaFecha,
      fecha_vencimiento: fechaVencimiento,
      estado,
      prioridad,
      motivos,
      ingreso_estimado: ingresoEstimado,
    });
  }

  // Ordenar de mayor a menor prioridad
  pacientes.sort((a, b) => b.prioridad - a.prioridad);

  const ingresoEstimadoTotal = Math.round(
    pacientes.reduce((acc, p) => acc + p.ingreso_estimado, 0) * 100
  ) / 100;

  return {
    mes,
    total: pacientes.length,
    ingreso_estimado_total: ingresoEstimadoTotal,
    pacientes,
  };
}
