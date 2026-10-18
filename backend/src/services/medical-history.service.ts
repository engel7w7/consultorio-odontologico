import { PrismaClient, TipoDiabetes, AntecedenteMedico, Prisma } from '@prisma/client';
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

function formatAuditValue(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Ninguna';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return String(val);
}

interface FieldChange {
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
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
   * Obtiene el historial de auditoría de un paciente, ordenado de más reciente a más antiguo.
   */
  async getAuditHistory(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    const records = await this.prisma.medicalHistoryAudit.findMany({
      where: { patient_id: patientId },
      orderBy: { fecha_hora: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      patient_id: r.patient_id,
      patientId: r.patient_id,
      campo: r.campo,
      valor_anterior: r.valor_anterior,
      valorAnterior: r.valor_anterior,
      valor_nuevo: r.valor_nuevo,
      valorNuevo: r.valor_nuevo,
      motivo: r.motivo,
      usuario_id: r.usuario_id,
      usuarioId: r.usuario_id,
      fecha_hora: r.fecha_hora,
      fechaHora: r.fecha_hora,
    }));
  }

  /**
   * Compara los antecedentes anteriores y nuevos campo por campo para registrar la auditoría.
   */
  private detectChanges(
    existing: AntecedenteMedico | null,
    data: UpsertMedicalHistoryInput
  ): FieldChange[] {
    const changes: FieldChange[] = [];

    // 1. Diabetes
    const oldDiabetes = existing ? Boolean(existing.tiene_diabetes) : false;
    const newDiabetes = Boolean(data.tiene_diabetes);
    if (!existing || oldDiabetes !== newDiabetes) {
      changes.push({
        campo: 'tiene_diabetes',
        valor_anterior: existing ? formatAuditValue(oldDiabetes) : null,
        valor_nuevo: formatAuditValue(newDiabetes),
      });
    }

    // 2. Tipo Diabetes
    const oldTipo = existing?.tiene_diabetes ? existing.tipo_diabetes || null : null;
    const newTipo = data.tiene_diabetes ? data.tipo_diabetes || null : null;
    if (oldTipo !== newTipo) {
      changes.push({
        campo: 'tipo_diabetes',
        valor_anterior: formatAuditValue(oldTipo),
        valor_nuevo: formatAuditValue(newTipo),
      });
    }

    // 3. Hipertensión
    const oldHipertension = existing ? Boolean(existing.tiene_hipertension) : false;
    const newHipertension = Boolean(data.tiene_hipertension);
    if (!existing || oldHipertension !== newHipertension) {
      changes.push({
        campo: 'tiene_hipertension',
        valor_anterior: existing ? formatAuditValue(oldHipertension) : null,
        valor_nuevo: formatAuditValue(newHipertension),
      });
    }

    // 4. Cardiopatía
    const oldCardiopatia = existing ? Boolean(existing.tiene_cardiopatia) : false;
    const newCardiopatia = Boolean(data.tiene_cardiopatia);
    if (!existing || oldCardiopatia !== newCardiopatia) {
      changes.push({
        campo: 'tiene_cardiopatia',
        valor_anterior: existing ? formatAuditValue(oldCardiopatia) : null,
        valor_nuevo: formatAuditValue(newCardiopatia),
      });
    }

    // 5. Anticoagulantes
    const oldAnticoagulantes = existing ? Boolean(existing.toma_anticoagulantes) : false;
    const newAnticoagulantes = Boolean(data.toma_anticoagulantes);
    if (!existing || oldAnticoagulantes !== newAnticoagulantes) {
      changes.push({
        campo: 'toma_anticoagulantes',
        valor_anterior: existing ? formatAuditValue(oldAnticoagulantes) : null,
        valor_nuevo: formatAuditValue(newAnticoagulantes),
      });
    }

    // 6. Embarazo
    const oldEmbarazo = existing ? Boolean(existing.esta_embarazada) : false;
    const newEmbarazo = Boolean(data.esta_embarazada);
    if (!existing || oldEmbarazo !== newEmbarazo) {
      changes.push({
        campo: 'esta_embarazada',
        valor_anterior: existing ? formatAuditValue(oldEmbarazo) : null,
        valor_nuevo: formatAuditValue(newEmbarazo),
      });
    }

    // 7. Alergias
    const oldAlergias = existing?.alergias && Array.isArray(existing.alergias)
      ? [...existing.alergias].map((a: string) => a.trim()).filter(Boolean).sort()
      : [];
    const newAlergias = data.alergias && Array.isArray(data.alergias)
      ? [...data.alergias].map((a: string) => a.trim()).filter(Boolean).sort()
      : [];

    if (!existing || oldAlergias.join(',').toLowerCase() !== newAlergias.join(',').toLowerCase()) {
      changes.push({
        campo: 'alergias',
        valor_anterior: existing ? formatAuditValue(oldAlergias) : null,
        valor_nuevo: formatAuditValue(newAlergias),
      });
    }

    // 8. Medicación actual
    const oldMed = existing?.medicacion_actual ? existing.medicacion_actual.trim() : null;
    const newMed = data.medicacion_actual ? data.medicacion_actual.trim() : null;
    if ((!existing && newMed) || (existing && oldMed !== newMed)) {
      changes.push({
        campo: 'medicacion_actual',
        valor_anterior: existing ? formatAuditValue(oldMed) : null,
        valor_nuevo: formatAuditValue(newMed),
      });
    }

    // 9. Otras condiciones
    const oldOtras = existing?.otras_condiciones ? existing.otras_condiciones.trim() : null;
    const newOtras = data.otras_condiciones ? data.otras_condiciones.trim() : null;
    if ((!existing && newOtras) || (existing && oldOtras !== newOtras)) {
      changes.push({
        campo: 'otras_condiciones',
        valor_anterior: existing ? formatAuditValue(oldOtras) : null,
        valor_nuevo: formatAuditValue(newOtras),
      });
    }

    return changes;
  }

  /**
   * Crea o actualiza (upsert) los antecedentes de un paciente e inserta la auditoría en UNA transacción.
   * Verifica la existencia del paciente ANTES del upsert.
   * Si no hubo cambios en los campos, no se guarda ni se audita.
   */
  async upsertMedicalHistory(patientId: string, data: UpsertMedicalHistoryInput) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    if (!data.motivo || typeof data.motivo !== 'string' || data.motivo.trim().length < 10) {
      throw new Error(
        'El motivo de la modificación es obligatorio y debe tener al menos 10 caracteres'
      );
    }

    const motivoLimpio = data.motivo.trim();
    const usuarioResponsable = data.usuario_id || data.usuarioId || 'Odontólogo Responsable';

    const existing = await this.prisma.antecedenteMedico.findUnique({
      where: { patient_id: patientId },
    });

    const changes = this.detectChanges(existing, data);

    // Si ya existe y no hay cambios en ningún campo clínico, no se guarda ni se audita
    if (existing && changes.length === 0) {
      return {
        ...existing,
        alertas: getAlertasCriticas(existing),
      };
    }

    const payload = {
      tiene_diabetes: data.tiene_diabetes,
      tipo_diabetes: data.tiene_diabetes ? data.tipo_diabetes : null,
      tiene_hipertension: data.tiene_hipertension,
      tiene_cardiopatia: data.tiene_cardiopatia,
      toma_anticoagulantes: data.toma_anticoagulantes,
      esta_embarazada: data.esta_embarazada,
      alergias: data.alergias,
      medicacion_actual: data.medicacion_actual?.trim() || null,
      otras_condiciones: data.otras_condiciones?.trim() || null,
    };

    const auditsToCreate = changes.map((c) => ({
      patient_id: patientId,
      campo: c.campo,
      valor_anterior: c.valor_anterior,
      valor_nuevo: c.valor_nuevo,
      motivo: motivoLimpio,
      usuario_id: usuarioResponsable,
    }));

    // Ejecución en UNA sola transacción atómica (prisma.$transaction)
    const saved = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.antecedenteMedico.upsert({
        where: { patient_id: patientId },
        create: {
          patient_id: patientId,
          ...payload,
        },
        update: payload,
      });

      if (auditsToCreate.length > 0) {
        await tx.medicalHistoryAudit.createMany({
          data: auditsToCreate,
        });
      }

      return updated;
    });

    return {
      ...saved,
      alertas: getAlertasCriticas(saved),
    };
  }
}
