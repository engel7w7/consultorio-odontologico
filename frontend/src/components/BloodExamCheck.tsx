import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    evidencia_archivo_nombre?: string | null;
    evidencia_archivo_url?: string | null;
    parametros_hematologicos?: string | null;
    fecha_validacion_examenes?: string | null;
  }>({
    nombre: 'Juan Pérez',
    edad: 34,
    procedimiento: 'Extracción de Tercer Molar (Cirugía)',
    telefono: '77712345',
    evidencia_archivo_nombre: 'estudio_hematologico_juan_perez.pdf',
    evidencia_archivo_url: null,
    parametros_hematologicos: 'Plaquetas: 240,000/µL | INR: 1.05 | Hemoglobina: 14.8 g/dL',
    fecha_validacion_examenes: null,
  });

  const [isValidated, setIsValidated] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'validated' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'recent'>('asc');

  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [parametrosTexto, setParametrosTexto] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const loadPatients = useCallback(async () => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients`);
      if (res.ok) {
        const data: Patient[] = await res.json();
        setPatients(data);

        const found = data.find((p) => p.id === initialPatientId);
        if (found) {
          setSelectedPatient({
            nombre: found.nombre,
            edad: found.edad,
            procedimiento: 'Extracción Dental Quirúrgica',
            telefono: found.telefono,
            evidencia_archivo_nombre: found.evidencia_archivo_nombre,
            evidencia_archivo_url: found.evidencia_archivo_url,
            parametros_hematologicos: found.parametros_hematologicos,
            fecha_validacion_examenes: found.fecha_validacion_examenes,
          });
          setIsValidated(found.examenes_sangre_validados);
          setUploadedFileName(found.evidencia_archivo_nombre || '');
          setUploadedFileUrl(found.evidencia_archivo_url || '');
          setParametrosTexto(found.parametros_hematologicos || '');
        }
      }
    } catch {
      // Estado de respaldo
    }
  }, [initialPatientId]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    setSelectedPatientId(initialPatientId);
    if (initialPatientId === 'sample-patient-id') {
      setSelectedPatient({
        nombre: 'Juan Pérez',
        edad: 34,
        procedimiento: 'Extracción de Tercer Molar (Cirugía)',
        telefono: '77712345',
        evidencia_archivo_nombre: 'estudio_hematologico_juan_perez.pdf',
        evidencia_archivo_url: null,
        parametros_hematologicos: 'Plaquetas: 240,000/µL | INR: 1.05 | Hemoglobina: 14.8 g/dL',
        fecha_validacion_examenes: null,
      });
      setIsValidated(initialStatus);
      setUploadedFileName('estudio_hematologico_juan_perez.pdf');
      setUploadedFileUrl('');
      setParametrosTexto('Plaquetas: 240,000/µL | INR: 1.05 | Hemoglobina: 14.8 g/dL');
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
        evidencia_archivo_nombre: 'estudio_hematologico_juan_perez.pdf',
        evidencia_archivo_url: null,
        parametros_hematologicos: 'Plaquetas: 240,000/µL | INR: 1.05 | Hemoglobina: 14.8 g/dL',
        fecha_validacion_examenes: null,
      });
      setIsValidated(false);
      setUploadedFileName('estudio_hematologico_juan_perez.pdf');
      setUploadedFileUrl('');
      setParametrosTexto('Plaquetas: 240,000/µL | INR: 1.05 | Hemoglobina: 14.8 g/dL');
      return;
    }

    const patient = patients.find((p) => p.id === id);
    if (patient) {
      setSelectedPatient({
        nombre: patient.nombre,
        edad: patient.edad,
        procedimiento: 'Extracción Dental Quirúrgica',
        telefono: patient.telefono,
        evidencia_archivo_nombre: patient.evidencia_archivo_nombre,
        evidencia_archivo_url: patient.evidencia_archivo_url,
        parametros_hematologicos: patient.parametros_hematologicos,
        fecha_validacion_examenes: patient.fecha_validacion_examenes,
      });
      setIsValidated(patient.examenes_sangre_validados);
      setUploadedFileName(patient.evidencia_archivo_nombre || '');
      setUploadedFileUrl(patient.evidencia_archivo_url || '');
      setParametrosTexto(patient.parametros_hematologicos || '');
    }
  };

  const filteredPatients = useMemo(() => {
    const list = [...patients];

    const filtered = list.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'validated'
          ? p.examenes_sangre_validados === true
          : p.examenes_sangre_validados === false;

      return matchSearch && matchStatus;
    });

    return filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      }
      if (sortOrder === 'desc') {
        return b.nombre.localeCompare(a.nombre, 'es', { sensitivity: 'base' });
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [patients, searchTerm, statusFilter, sortOrder]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedFileUrl(result);
      setMensaje({
        tipo: 'ok',
        texto: `Archivo "${file.name}" cargado exitosamente. Listo para validar la evidencia.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEvidence = async (targetValidationStatus: boolean) => {
    setLoading(true);
    setMensaje(null);

    if (targetValidationStatus && !uploadedFileName && !uploadedFileUrl) {
      setMensaje({
        tipo: 'error',
        texto: 'Por favor, adjunta el estudio escaneado para conceder la Luz Verde Médica.',
      });
      setLoading(false);
      return;
    }

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients/${selectedPatientId}/blood-exams`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examenes_sangre_validados: targetValidationStatus,
          evidencia_archivo_nombre: targetValidationStatus ? uploadedFileName : null,
          evidencia_archivo_url: targetValidationStatus ? uploadedFileUrl : null,
          parametros_hematologicos: targetValidationStatus ? parametrosTexto : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al actualizar el estado de exámenes');
      }

      const data = await res.json();
      const updatedStatus = data.examenes_sangre_validados;
      setIsValidated(updatedStatus);

      setPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatientId
            ? {
                ...p,
                examenes_sangre_validados: updatedStatus,
                evidencia_archivo_nombre: data.evidencia_archivo_nombre,
                evidencia_archivo_url: data.evidencia_archivo_url,
                parametros_hematologicos: data.parametros_hematologicos,
                fecha_validacion_examenes: data.fecha_validacion_examenes,
              }
            : p
        )
      );

      setSelectedPatient((prev) => ({
        ...prev,
        evidencia_archivo_nombre: data.evidencia_archivo_nombre,
        evidencia_archivo_url: data.evidencia_archivo_url,
        parametros_hematologicos: data.parametros_hematologicos,
        fecha_validacion_examenes: data.fecha_validacion_examenes,
      }));

      if (onStatusChange) onStatusChange(updatedStatus);

      setMensaje({
        tipo: 'ok',
        texto: updatedStatus
          ? 'Evidencia guardada y Luz Verde Médica concedida exitosamente para el procedimiento de extracción.'
          : 'Validación médica revocada. La intervención quirúrgica queda en estado pendiente.',
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
      <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/40 text-blue-900 shadow-xs flex items-start space-x-3.5">
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-950">
            Regla de Negocio: Control Pre-Operatorio de Extracciones (HU-07)
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            Es obligatorio registrar y subir las evidencias de los estudios hematológicos escaneados (hemograma, recuento de plaquetas y tiempos de coagulación) para respaldar la <strong>Luz Verde Médica</strong> antes de realizar cualquier extracción o cirugía bucal invasiva.
          </p>
        </div>
      </div>

      {mensaje && (
        <div
          className={`p-3.5 rounded-lg text-sm border flex items-center space-x-2.5 transition-all ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="shrink-0">
            {mensaje.tipo === 'ok' ? (
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <span className="font-medium text-xs leading-relaxed">{mensaje.texto}</span>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Directorio de Pacientes para Validación de Exámenes
            </h3>
            <p className="text-xs text-slate-500">
              Filtra y ordena alfabéticamente para seleccionar al paciente a evaluar
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {filteredPatients.length} de {patients.length} pacientes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-[11px] transition ${
                statusFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('validated')}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-[11px] transition ${
                statusFilter === 'validated'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Luz Verde
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-[11px] transition ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
              Orden:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc' | 'recent')}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="asc">Alfabético (A - Z)</option>
              <option value="desc">Alfabético (Z - A)</option>
              <option value="recent">Más recientes</option>
            </select>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/30">
          <button
            type="button"
            onClick={() => handleSelectPatient('sample-patient-id')}
            className={`w-full p-3 text-left transition flex items-center justify-between gap-3 ${
              selectedPatientId === 'sample-patient-id'
                ? 'bg-blue-50/80 border-l-4 border-blue-600'
                : 'hover:bg-slate-100/70'
            }`}
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-slate-900">Juan Pérez</span>
                <span className="text-[11px] text-slate-500">(34 años)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  Demo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Procedimiento: Extracción de Tercer Molar (Cirugía)
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Exámenes Pendientes
            </span>
          </button>

          {filteredPatients.map((p) => {
            const isSelected = selectedPatientId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPatient(p.id)}
                className={`w-full p-3 text-left transition flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/80 border-l-4 border-blue-600'
                    : 'hover:bg-slate-100/70'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{p.nombre}</span>
                    <span className="text-[11px] text-slate-500">({p.edad} años)</span>
                    {p.evidencia_archivo_nombre && (
                      <span className="inline-flex items-center text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Estudio adjunto
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tel: {p.telefono}
                  </p>
                </div>
                <div>
                  {p.examenes_sangre_validados ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ● Luz Verde Médica
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      ○ Exámenes Pendientes
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredPatients.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              No se encontraron pacientes que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
      </div>

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

        <div
          className={`p-5 rounded-xl border transition-all ${
            isValidated
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isValidated ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {isValidated ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                    </svg>
                  )}
                </div>
                <h4 className="font-bold text-sm">
                  {isValidated
                    ? 'Luz Verde Médica Concedida'
                    : 'Procedimiento Quirúrgico Bloqueado'}
                </h4>
              </div>
              <p className="text-xs leading-relaxed max-w-xl text-slate-700">
                {isValidated
                  ? 'El paciente cuenta con respaldo de evidencia hematológica aprobada. El odontólogo puede proceder con la extracción de forma segura.'
                  : 'Extracción no permitida según la regla de negocio. Para habilitar la cirugía, debes cargar el estudio hematológico escaneado.'}
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-3">
              {isValidated && (
                <button
                  type="button"
                  onClick={() => handleSaveEvidence(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold rounded-lg transition bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shadow-xs"
                >
                  Revocar Luz Verde
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <h4 className="text-sm font-bold text-slate-800">
                Subir Evidencia de Estudios Escaneados (Hemograma y Coagulación)
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              PDF, JPG, PNG (Fácil de subir)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-white hover:bg-slate-50/80 transition flex flex-col items-center justify-center space-y-2">
              <input
                type="file"
                id="file-evidence-input"
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-evidence-input"
                className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition border border-indigo-200"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Seleccionar o Escanear Estudio</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Arrastra aquí el hemograma escaneado o haz clic para examinar
              </p>

              {uploadedFileName && (
                <div className="w-full mt-2 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold text-indigo-950 truncate max-w-xs">
                      {uploadedFileName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {uploadedFileUrl && (
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="text-[11px] font-bold text-indigo-700 hover:underline"
                      >
                        Ver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileName('');
                        setUploadedFileUrl('');
                      }}
                      className="text-slate-400 hover:text-rose-600 transition"
                      title="Quitar archivo"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Parámetros Hematológicos y Observaciones Clínicas
              </label>
              <textarea
                rows={3}
                value={parametrosTexto}
                onChange={(e) => setParametrosTexto(e.target.value)}
                placeholder="Ej: Plaquetas: 250,000/µL, INR: 1.1, TP: 12 seg. Paciente apto para procedimiento de extracción sin riesgo de sangrado."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
              />
              <p className="text-[10px] text-slate-400">
                Registra los valores clínicos del estudio para el expediente permanente.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => handleSaveEvidence(true)}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{loading ? 'Guardando Evidencia...' : 'Subir Evidencia y Otorgar Luz Verde'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Parámetros Hematológicos Pre-Quirúrgicos Requeridos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Hemograma Completo</span>
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Recuento plaquetario mayor a 150,000/µL y serie roja estable para hemostasia.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Tiempos de Coagulación</span>
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                TP, TTPa e INR menores a 1.5 para garantizar coagulación normal post-extracción.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                <span>Glicemia en Ayunas</span>
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Niveles menores a 180 mg/dL para asegurar óptima cicatrización y prevenir infecciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPreviewModal && uploadedFileUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                Vista Previa: {uploadedFileName}
              </h4>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              {uploadedFileUrl.startsWith('data:image') ? (
                <img src={uploadedFileUrl} alt="Estudio escaneado" className="max-h-[55vh] object-contain rounded" />
              ) : (
                <iframe
                  src={uploadedFileUrl}
                  title="Documento Escaneado"
                  className="w-full h-96 rounded"
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
