/**
 * Utilidades y reglas de negocio para el módulo de Retorno / Recall de Pacientes (HU-14).
 * Funciones puras y deterministas para facilitar pruebas unitarias.
 */

export interface CitaParaRecall {
  id: string;
  motivo: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: string;
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
 * Evalúa las citas históricas y detecta pacientes con profilaxis vencida (hace 6 meses o más).
 * Reglas:
 * 1. Solo cuentan citas en estado ATENDIDA con motivo de profilaxis.
 * 2. Por paciente, toma la ÚLTIMA profilaxis atendida.
 * 3. Vencida si hoy >= fecha_vencimiento.
 * 4. Reagendado si el paciente tiene una cita PROGRAMADA futura (fecha_inicio > hoy).
 * 5. Ordenado por dias_atraso DESC.
 */
export function evaluarProfilaxisVencidas(
  citas: CitaParaRecall[],
  hoy: Date = new Date()
): ProfilaxisVencidaItem[] {
  // Agrupar citas por paciente
  const citasPorPaciente = new Map<string, {
    patient: { id: string; nombre: string; telefono: string };
    citas: CitaParaRecall[];
  }>();

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
    // 1. Filtrar profilaxis atendidas
    const profilaxisAtendidas = info.citas
      .filter((c) => c.estado === 'ATENDIDA' && esProfilaxis(c.motivo))
      .sort((a, b) => b.fecha_inicio.getTime() - a.fecha_inicio.getTime());

    if (profilaxisAtendidas.length === 0) {
      continue;
    }

    // 2. Tomar la última profilaxis realizada
    const ultimaProfilaxisCita = profilaxisAtendidas[0];
    const ultimaFecha = new Date(ultimaProfilaxisCita.fecha_inicio);
    const fechaVencimiento = sumarMesesCalendario(ultimaFecha, 6);
    const vencimientoMedianoche = normalizarMedianoche(fechaVencimiento);

    // 3. Evaluar si está vencida: hoy >= fecha_vencimiento
    if (hoyMedianoche.getTime() < vencimientoMedianoche.getTime()) {
      continue; // Aún no cumple los 6 meses de antigüedad
    }

    // 4. Calcular días de atraso
    const diffMs = hoyMedianoche.getTime() - vencimientoMedianoche.getTime();
    const diasAtraso = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // 5. Evaluar si está reagendado (cita PROGRAMADA futura)
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

  // 6. Ordenar por dias_atraso DESC
  return resultado.sort((a, b) => b.dias_atraso - a.dias_atraso);
}
