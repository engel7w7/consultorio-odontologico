export type OrdenHistorial = 'asc' | 'desc';

export interface TratamientoHistorial {
  id: string;
  fecha: string;
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
