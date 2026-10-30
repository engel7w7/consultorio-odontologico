import { PrismaClient, Appointment } from '@prisma/client';
import { OrdenHistorial } from '../schemas/patient-history.schema.js';

export class PatientHistoryError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PatientHistoryError';
    this.code = code;
  }
}

/**
 * Tratamiento del historial clínico (HU-10).
 * Contrato de respuesta independiente del modelo Prisma: en HU-09 se podrán
 * agregar campos opcionales (pieza dental, diagnóstico) sin romper consumidores.
 */
export interface TratamientoHistorial {
  id: string;
  fecha: Date;
  procedimiento: string;
  duracion_minutos: number;
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
 * Función pura que convierte una cita atendida en un tratamiento del historial.
 */
export function toTratamiento(cita: CitaAtendida): TratamientoHistorial {
  const duracionMs = cita.fecha_fin.getTime() - cita.fecha_inicio.getTime();
  return {
    id: cita.id,
    fecha: cita.fecha_inicio,
    procedimiento: cita.motivo,
    duracion_minutos: Math.max(0, Math.round(duracionMs / 60000)),
  };
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
}
