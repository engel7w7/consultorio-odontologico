export type OrdenHistorial = 'asc' | 'desc';

export interface TratamientoHistorial {
  id: string;
  fecha: string;
  procedimiento: string;
  duracion_minutos: number;
  pieza_fdi?: number | null;
  diente_nombre?: string | null;
  superficie?: string | null;
  diagnostico?: string | null;
  cie10?: string | null;
  nomenclatura_rapida?: string | null;
}

export interface CreateTreatmentPayload {
  nomenclatura_rapida: string;
  fecha?: string;
  duracion_minutos?: number;
  observaciones?: string;
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
