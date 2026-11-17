import { PrismaClient, Appointment } from '@prisma/client';
import { OrdenHistorial, CreateTreatmentInput } from '../schemas/patient-history.schema.js';
import { parseQuickTreatment } from '../utils/fdi-notation.utils.js';

export class PatientHistoryError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PatientHistoryError';
    this.code = code;
  }
}

/**
 * Tratamiento del historial clínico (HU-10 y HU-09).
 * Contrato de respuesta enriquecido con metadatos ISO 3950 y CIE-10.
 */
export interface TratamientoHistorial {
  id: string;
  fecha: Date;
  procedimiento: string;
  duracion_minutos: number;
  pieza_fdi?: number | null;
  diente_nombre?: string | null;
  superficie?: string | null;
  diagnostico?: string | null;
  cie10?: string | null;
  nomenclatura_rapida?: string | null;
}

export interface HistorialPaciente {
  patient: {
    id: string;
    nombre: string;
    edad: number;
    telefono: string;
  };
  total: number;
  tratamientos: TratamientoHistorial[];
}

type CitaAtendida = Pick<Appointment, 'id' | 'motivo' | 'fecha_inicio' | 'fecha_fin'>;

/**
 * Función pura que convierte una cita atendida en un tratamiento del historial,
 * extrayendo metadatos odontológicos según ISO 3950 y CIE-10 (HU-09).
 */
export function toTratamiento(cita: CitaAtendida): TratamientoHistorial {
  const duracionMs = cita.fecha_fin.getTime() - cita.fecha_inicio.getTime();
  const parsed = parseQuickTreatment(cita.motivo);
  const item: TratamientoHistorial = {
    id: cita.id,
    fecha: cita.fecha_inicio,
    procedimiento: cita.motivo,
    duracion_minutos: Math.max(0, Math.round(duracionMs / 60000)),
  };

  if (parsed.pieza_fdi !== null) item.pieza_fdi = parsed.pieza_fdi;
  if (parsed.diente_nombre !== null) item.diente_nombre = parsed.diente_nombre;
  if (parsed.superficie !== null) item.superficie = parsed.superficie;
  if (parsed.diagnostico !== null && (parsed.pieza_fdi !== null || parsed.superficie !== null)) {
    item.diagnostico = parsed.diagnostico;
  }
  if (parsed.cie10 !== null && (parsed.pieza_fdi !== null || parsed.superficie !== null)) {
    item.cie10 = parsed.cie10;
  }
  if (parsed.raw && (parsed.pieza_fdi !== null || parsed.superficie !== null)) {
    item.nomenclatura_rapida = parsed.raw;
  }

  return item;
}

export class PatientHistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Obtiene el historial cronológico de tratamientos (citas ATENDIDAS) de un paciente.
   * Solo consulta citas del paciente solicitado para evitar mezcla de datos.
   */
  async getHistory(patientId: string, orden: OrdenHistorial = 'desc'): Promise<HistorialPaciente> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new PatientHistoryError('Paciente no encontrado', 'PATIENT_NOT_FOUND');
    }

    const citas = await this.prisma.appointment.findMany({
      where: { patient_id: patientId, estado: 'ATENDIDA' },
      orderBy: [{ fecha_inicio: orden }, { id: orden }],
    });

    const tratamientos = citas.map(toTratamiento);

    return {
      patient: {
        id: patient.id,
        nombre: patient.nombre,
        edad: patient.edad,
        telefono: patient.telefono,
      },
      total: tratamientos.length,
      tratamientos,
    };
  }

  /**
   * Registra un tratamiento realizado usando nomenclatura rápida (HU-09).
   * Persiste la atención en el historial del paciente correspondiente (estado ATENDIDA).
   */
  async registerTreatment(patientId: string, data: CreateTreatmentInput): Promise<TratamientoHistorial> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new PatientHistoryError('Paciente no encontrado', 'PATIENT_NOT_FOUND');
    }

    const parsed = parseQuickTreatment(data.nomenclatura_rapida);

    // Validación de seguridad clínica (HU-08 / SQAP): si es extracción y no tiene exámenes validados
    const isExtraction =
      /extracc|exodoncia|cirug|quir[uú]rg|muela|molar/i.test(data.nomenclatura_rapida) ||
      parsed.cie10 === 'K08.1';
    if (isExtraction && !patient.examenes_sangre_validados) {
      throw new PatientHistoryError(
        'Alerta Roja de Seguridad: No se pueden registrar extracciones sin exámenes de sangre validados',
        'EXTRACTION_BLOOD_EXAMS_REQUIRED'
      );
    }

    const duracionMinutos = data.duracion_minutos || parsed.duracion_minutos || 30;
    const fechaInicio = data.fecha ? new Date(data.fecha) : new Date();
    const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);

    const motivo = parsed.descripcion_clinica || data.nomenclatura_rapida.trim();

    const cita = await this.prisma.appointment.create({
      data: {
        patient_id: patientId,
        motivo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'ATENDIDA',
      },
    });

    return toTratamiento(cita);
  }
}
