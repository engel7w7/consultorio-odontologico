export interface Patient {
  id: string;
  nombre: string;
  telefono: string;
  edad: number;
  examenes_sangre_validados: boolean;
  evidencia_archivo_nombre?: string | null;
  evidencia_archivo_url?: string | null;
  parametros_hematologicos?: string | null;
  fecha_validacion_examenes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateBloodExamPayload {
  examenes_sangre_validados: boolean;
  evidencia_archivo_nombre?: string | null;
  evidencia_archivo_url?: string | null;
  parametros_hematologicos?: string | null;
}
