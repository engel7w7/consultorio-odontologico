export type TipoDiabetes = 'TIPO_1' | 'TIPO_2' | 'GESTACIONAL' | 'OTRO';

export interface AntecedenteMedico {
  id: string;
  patient_id: string;
  tiene_diabetes: boolean;
  tipo_diabetes: TipoDiabetes | null;
  tiene_hipertension: boolean;
  tiene_cardiopatia: boolean;
  toma_anticoagulantes: boolean;
  esta_embarazada: boolean;
  alergias: string[];
  medicacion_actual: string | null;
  otras_condiciones: string | null;
  created_at: string;
  updated_at: string;
  alertas?: string[];
}

export interface MedicalHistoryPayload {
  tiene_diabetes: boolean;
  tipo_diabetes: TipoDiabetes | null;
  tiene_hipertension: boolean;
  tiene_cardiopatia: boolean;
  toma_anticoagulantes: boolean;
  esta_embarazada: boolean;
  alergias: string[];
  medicacion_actual?: string | null;
  otras_condiciones?: string | null;
  motivo?: string;
  usuario_id?: string;
}

export interface MedicalHistoryAudit {
  id: string;
  patient_id: string;
  patientId?: string;
  campo: string;
  valor_anterior: string | null;
  valorAnterior?: string | null;
  valor_nuevo: string | null;
  valorNuevo?: string | null;
  motivo: string;
  usuario_id?: string | null;
  usuarioId?: string | null;
  fecha_hora: string;
  fechaHora?: string;
}
