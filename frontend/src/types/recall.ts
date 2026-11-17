export interface ProfilaxisVencidaItem {
  patient: {
    id: string;
    nombre: string;
    telefono: string;
  };
  ultima_profilaxis: string;
  fecha_vencimiento: string;
  dias_atraso: number;
  reagendado: boolean;
  proxima_cita: string | null;
}

export interface PacienteRetornoItem {
  patient: {
    id: string;
    nombre: string;
    telefono: string;
  };
  ultima_profilaxis: string;
  fecha_vencimiento: string;
  estado: 'VENCE_ESTE_MES' | 'ATRASADO';
  prioridad: number;
  motivos: string[];
  ingreso_estimado: number;
}

export interface RetornoMensualResponse {
  mes: string;
  total: number;
  ingreso_estimado_total: number;
  pacientes: PacienteRetornoItem[];
}
