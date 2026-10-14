import { PrismaClient, TipoDiabetes } from '@prisma/client';
import { UpsertMedicalHistoryInput } from '../schemas/medical-history.schema.js';

export interface AntecedenteCriticoInput {
  tiene_diabetes: boolean;
  tipo_diabetes?: TipoDiabetes | null;
  tiene_hipertension: boolean;
  tiene_cardiopatia: boolean;
  toma_anticoagulantes: boolean;
  esta_embarazada: boolean;
  alergias: string[];
}

const tipoDiabetesMap: Record<TipoDiabetes, string> = {
  TIPO_1: 'Diabetes tipo 1',
  TIPO_2: 'Diabetes tipo 2',
  GESTACIONAL: 'Diabetes gestacional',
  OTRO: 'Diabetes (otro)',
};

/**
 * Función pura que calcula las alertas médicas críticas ordenadas por prioridad odontológica.
 * Las alergias van primero por su criticidad (anestésicos, antibióticos, látex).
 */
export function getAlertasCriticas(
  antecedente: AntecedenteCriticoInput | null | undefined
): string[] {
  if (!antecedente) return [];

  const alertas: string[] = [];

  // 1. Alergias primero (las más críticas en el sillón odontológico)
  if (Array.isArray(antecedente.alergias)) {
    for (const alergia of antecedente.alergias) {
      const trimmed = alergia.trim();
      if (trimmed.length > 0) {
        alertas.push(`Alergia: ${trimmed}`);
      }
    }
  }

  // 2. Anticoagulantes (riesgo crítico de hemorragia)
  if (antecedente.toma_anticoagulantes) {
    alertas.push('Anticoagulantes');
  }

  // 3. Diabetes
  if (antecedente.tiene_diabetes) {
    const texto = antecedente.tipo_diabetes
      ? tipoDiabetesMap[antecedente.tipo_diabetes]
      : 'Diabetes';
    alertas.push(texto || 'Diabetes');
  }

  // 4. Cardiopatía
  if (antecedente.tiene_cardiopatia) {
    alertas.push('Cardiopatía');
  }

  // 5. Hipertensión
  if (antecedente.tiene_hipertension) {
    alertas.push('Hipertensión');
  }

  // 6. Embarazo
  if (antecedente.esta_embarazada) {
    alertas.push('Embarazo');
  }

  return alertas;
}

export class MedicalHistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Obtiene los antecedentes de un paciente.
   * Lanza error si el paciente no existe.
   * Devuelve null si el paciente existe pero aún no tiene antecedentes.
   */
  async getByPatientId(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    const antecedente = await this.prisma.antecedenteMedico.findUnique({
      where: { patient_id: patientId },
    });

    if (!antecedente) {
      return null;
    }

    return {
      ...antecedente,
      alertas: getAlertasCriticas(antecedente),
    };
  }

  /**
   * Crea o actualiza (upsert) los antecedentes de un paciente.
   * Verifica la existencia del paciente ANTES del upsert.
   */
  async upsertMedicalHistory(patientId: string, data: UpsertMedicalHistoryInput) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    const saved = await this.prisma.antecedenteMedico.upsert({
      where: { patient_id: patientId },
      create: {
        patient_id: patientId,
        tiene_diabetes: data.tiene_diabetes,
        tipo_diabetes: data.tiene_diabetes ? data.tipo_diabetes : null,
        tiene_hipertension: data.tiene_hipertension,
        tiene_cardiopatia: data.tiene_cardiopatia,
        toma_anticoagulantes: data.toma_anticoagulantes,
        esta_embarazada: data.esta_embarazada,
        alergias: data.alergias,
        medicacion_actual: data.medicacion_actual ?? null,
        otras_condiciones: data.otras_condiciones ?? null,
      },
      update: {
        tiene_diabetes: data.tiene_diabetes,
        tipo_diabetes: data.tiene_diabetes ? data.tipo_diabetes : null,
        tiene_hipertension: data.tiene_hipertension,
        tiene_cardiopatia: data.tiene_cardiopatia,
        toma_anticoagulantes: data.toma_anticoagulantes,
        esta_embarazada: data.esta_embarazada,
        alergias: data.alergias,
        medicacion_actual: data.medicacion_actual ?? null,
        otras_condiciones: data.otras_condiciones ?? null,
      },
    });

    return {
      ...saved,
      alertas: getAlertasCriticas(saved),
    };
  }
}
