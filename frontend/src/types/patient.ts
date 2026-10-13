export interface Patient {
  id: string;
  nombre: string;
  telefono: string;
  edad: number;
  examenes_sangre_validados: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateBloodExamPayload {
  examenes_sangre_validados: boolean;
}
