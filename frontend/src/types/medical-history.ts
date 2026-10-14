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
}
