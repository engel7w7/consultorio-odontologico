import React, { useState, useEffect, useCallback } from 'react';
import type { Patient } from '../types/patient';

interface BloodExamCheckProps {
  patientId?: string;
  initialStatus?: boolean;
  onStatusChange?: (newStatus: boolean) => void;
}

export const BloodExamCheck: React.FC<BloodExamCheckProps> = ({
  patientId: initialPatientId = 'sample-patient-id',
  initialStatus = false,
  onStatusChange,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
  const [selectedPatient, setSelectedPatient] = useState<{
    nombre: string;
    edad: number | string;
    procedimiento: string;
    telefono?: string;
  }>({
    nombre: 'Juan Pérez',
    edad: 34,
    procedimiento: 'Extracción de Tercer Molar (Cirugía)',
    telefono: '77712345',
  });

  const [isValidated, setIsValidated] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Cargar lista de pacientes para permitir seleccionar cualquier paciente del consultorio
  const loadPatients = useCallback(async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients`);
      if (res.ok) {
        const data: Patient[] = await res.json();
        setPatients(data);

        // Si el initialPatientId coincide con alguno, asignarlo
        const found = data.find((p) => p.id === initialPatientId);
        if (found) {
          setSelectedPatient({
            nombre: found.nombre,
            edad: found.edad,
            procedimiento: 'Extracción Dental Planificada',
            telefono: found.telefono,
          });
          setIsValidated(found.examenes_sangre_validados);
        }
      }
    } catch {
      // Si falla o está en pruebas aisladas, mantener estado base
    }
  }, [initialPatientId]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Si cambia initialPatientId desde prop
  useEffect(() => {
    setSelectedPatientId(initialPatientId);
    if (initialPatientId === 'sample-patient-id') {
      setSelectedPatient({
        nombre: 'Juan Pérez',
        edad: 34,
        procedimiento: 'Extracción de Tercer Molar (Cirugía)',
        telefono: '77712345',
      });
      setIsValidated(initialStatus);
    }
  }, [initialPatientId, initialStatus]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setMensaje(null);

    if (id === 'sample-patient-id') {
      setSelectedPatient({
        nombre: 'Juan Pérez',
        edad: 34,
        procedimiento: 'Extracción de Tercer Molar (Cirugía)',
        telefono: '77712345',
      });
      setIsValidated(false);
      return;
    }

    const patient = patients.find((p) => p.id === id);
    if (patient) {
      setSelectedPatient({
        nombre: patient.nombre,
        edad: patient.edad,
        procedimiento: 'Extracción Dental Planificada',
        telefono: patient.telefono,
      });
      setIsValidated(patient.examenes_sangre_validados);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    setMensaje(null);
    const targetStatus = !isValidated;

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients/${selectedPatientId}/blood-exams`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examenes_sangre_validados: targetStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al actualizar el estado de exámenes');
      }

      const data = await res.json();
      const updatedStatus = data.examenes_sangre_validados;
      setIsValidated(updatedStatus);

      // Actualizar también en el estado local de pacientes
      setPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatientId
            ? { ...p, examenes_sangre_validados: updatedStatus }
            : p
        )
      );

      if (onStatusChange) onStatusChange(updatedStatus);

      setMensaje({
        tipo: 'ok',
        texto: updatedStatus
          ? 'Exámenes validados exitosamente. Luz verde médica concedida para extracción.'
          : 'Validación médica revocada. El procedimiento queda en estado pendiente.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar exámenes';
      setMensaje({ tipo: 'error', texto: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Regla de Negocio Clínica */}
      <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/40 text-blue-900 shadow-xs flex items-start space-x-3">
        <div className="text-xl">🩺</div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-950">
            Regla de Negocio: Control Pre-Operatorio de Extracciones
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            Como odontólogo, para proceder con cualquier extracción o cirugía bucal invasiva, es
            obligatorio verificar y registrar la validación de los exámenes de sangre (hemograma,
            plaquetas y tiempos de coagulación) para obtener la <strong>Luz Verde Médica</strong>.
          </p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`p-3.5 rounded-lg text-sm border flex items-center space-x-2 transition-all ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{mensaje.tipo === 'ok' ? '✓' : '⚠️'}</span>
          <span className="font-medium">{mensaje.texto}</span>
        </div>
      )}

      {/* Selector de Pacientes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Seleccionar Paciente para Validación Pre-Operatoria
          </label>
          <span className="text-xs text-slate-400">
            {patients.length > 0
              ? `${patients.length} pacientes en sistema`
              : 'Paciente de evaluación rápida'}
          </span>
        </div>

        <select
          value={selectedPatientId}
          onChange={(e) => handleSelectPatient(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        >
          <option value="sample-patient-id">
            Juan Pérez (34 años) - Paciente de Prueba para Extracción de Tercer Molar
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.edad} años) - {p.examenes_sangre_validados ? '✓ Con Luz Verde' : '○ Exámenes Pendientes'}
            </option>
          ))}
        </select>
      </div>

      {/* Expediente Clínico Pre-Quirúrgico */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Expediente Clínico del Paciente</h3>
            <p className="text-xs text-slate-500">Evaluación médica para procedimientos quirúrgicos</p>
          </div>
          <div className="flex items-center space-x-2">
            {isValidated ? (
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                ● Luz Verde Médica
              </span>
            ) : (
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                ○ Exámenes Pendientes
              </span>
            )}
          </div>
        </div>

        {/* Ficha de Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-0.5">Paciente</span>
            <span className="font-semibold text-slate-800">{selectedPatient.nombre}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-0.5">Edad</span>
            <span className="font-semibold text-slate-800">{selectedPatient.edad} años</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-0.5">Procedimiento</span>
            <span className="font-semibold text-slate-800">{selectedPatient.procedimiento}</span>
          </div>
        </div>

        {/* Panel de Estado y Dictamen Quirúrgico */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            isValidated
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/60 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{isValidated ? '🛡️' : '⚠️'}</span>
                <h4 className="font-bold text-sm">
                  {isValidated
                    ? 'Luz Verde Médica Concedida'
                    : 'Procedimiento Quirúrgico Bloqueado'}
                </h4>
              </div>
              <p className="text-xs leading-relaxed max-w-xl">
                {isValidated
                  ? 'El paciente cuenta con parámetros de coagulación y hemograma aprobados. El odontólogo puede proceder con la extracción de forma segura.'
                  : 'Extracción no permitida según la regla de negocio de la clínica. Debe corroborar los exámenes de sangre antes de intervenir.'}
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-3">
              <button
                onClick={handleToggle}
                disabled={loading}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg shadow-sm hover:shadow transition text-white flex items-center space-x-2 disabled:opacity-50 ${
                  isValidated
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <span>
                  {loading
                    ? 'Guardando...'
                    : isValidated
                    ? 'Revocar Validación'
                    : 'Validar Exámenes'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Checklist de Exámenes de Sangre */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Checklist de Parámetros Hematológicos Pre-Quirúrgicos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="font-semibold text-slate-800 block">🩸 Hemograma Completo</span>
              <p className="text-slate-500 text-[11px]">Recuento de plaquetas y glóbulos rojos dentro de rangos normales.</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="font-semibold text-slate-800 block">⏱️ Tiempos de Coagulación</span>
              <p className="text-slate-500 text-[11px]">TP, TTPa e INR aptos para hemostasia normal durante la extracción.</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="font-semibold text-slate-800 block">🧪 Glicemia en Ayunas</span>
              <p className="text-slate-500 text-[11px]">Niveles de glucosa adecuados para cicatrización post-operatoria.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
