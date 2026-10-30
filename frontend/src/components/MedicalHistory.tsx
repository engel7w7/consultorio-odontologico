import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Patient } from '../types/patient';
import type {
  AntecedenteMedico,
  MedicalHistoryPayload,
  MedicalHistoryAudit,
  TipoDiabetes,
} from '../types/medical-history';

const emptyForm: MedicalHistoryPayload = {
  tiene_diabetes: false,
  tipo_diabetes: null,
  tiene_hipertension: false,
  tiene_cardiopatia: false,
  toma_anticoagulantes: false,
  esta_embarazada: false,
  alergias: [],
  medicacion_actual: '',
  otras_condiciones: '',
};

const campoLabels: Record<string, string> = {
  tiene_diabetes: 'Diabetes',
  tipo_diabetes: 'Tipo de diabetes',
  tiene_hipertension: 'Hipertensión arterial',
  tiene_cardiopatia: 'Cardiopatía',
  toma_anticoagulantes: 'Anticoagulantes',
  esta_embarazada: 'Embarazo',
  alergias: 'Alergias',
  medicacion_actual: 'Medicación actual',
  otras_condiciones: 'Otras condiciones',
};

export const MedicalHistory: React.FC = () => {
  // Directorio de pacientes
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Filtros y orden del directorio
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'alerts' | 'none'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'recent'>('asc');

  // Antecedentes del paciente seleccionado
  const [formData, setFormData] = useState<MedicalHistoryPayload>(emptyForm);
  const [initialFormData, setInitialFormData] = useState<MedicalHistoryPayload>(emptyForm);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [hasHistory, setHasHistory] = useState<boolean>(false);

  // Estados de interfaz y edición
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [motivo, setMotivo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [alergiaInput, setAlergiaInput] = useState<string>('');

  // Historial de auditoría
  const [auditRecords, setAuditRecords] = useState<MedicalHistoryAudit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentPatientIdRef = useRef<string>(selectedPatientId);

  useEffect(() => {
    currentPatientIdRef.current = selectedPatientId;
  }, [selectedPatientId]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cargar lista de pacientes
  const loadPatients = useCallback(async () => {
    try {
      setLoadingPatients(true);
      setPatientLoadError(null);
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients`);
      if (!res.ok) {
        throw new Error('Error al cargar la lista de pacientes');
      }
      const data: Patient[] = await res.json();
      setPatients(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar pacientes';
      setPatientLoadError(msg);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Cargar historial de auditoría
  const fetchAuditRecords = useCallback(async (patientId: string) => {
    try {
      setLoadingAudit(true);
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients/${patientId}/medical-history/audit`);
      if (res.ok) {
        const data: MedicalHistoryAudit[] = await res.json();
        setAuditRecords(data);
      } else {
        setAuditRecords([]);
      }
    } catch {
      setAuditRecords([]);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  // Consultar antecedentes de un paciente
  const fetchMedicalHistory = useCallback(
    async (patientId: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      setSaveSuccess(null);
      setIsEditing(false);
      setMotivo('');

      setFormData(emptyForm);
      setInitialFormData(emptyForm);
      setAlertas([]);

      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const res = await fetch(`${apiUrl}/api/patients/${patientId}/medical-history`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error al obtener antecedentes médicos');
        }

        const data: AntecedenteMedico | null = await res.json();

        if (currentPatientIdRef.current !== patientId) {
          return;
        }

        if (data) {
          const loaded: MedicalHistoryPayload = {
            tiene_diabetes: Boolean(data.tiene_diabetes),
            tipo_diabetes: data.tipo_diabetes,
            tiene_hipertension: Boolean(data.tiene_hipertension),
            tiene_cardiopatia: Boolean(data.tiene_cardiopatia),
            toma_anticoagulantes: Boolean(data.toma_anticoagulantes),
            esta_embarazada: Boolean(data.esta_embarazada),
            alergias: Array.isArray(data.alergias) ? data.alergias : [],
            medicacion_actual: data.medicacion_actual || '',
            otras_condiciones: data.otras_condiciones || '',
          };
          setFormData(loaded);
          setInitialFormData(loaded);
          setAlertas(data.alertas || []);
          setHasHistory(true);
        } else {
          setFormData(emptyForm);
          setInitialFormData(emptyForm);
          setAlertas([]);
          setHasHistory(false);
        }
        setLoading(false);
      } catch (err: unknown) {
        if (currentPatientIdRef.current !== patientId) return;
        if (
          (err instanceof DOMException && err.name === 'AbortError') ||
          (err instanceof Error && err.name === 'AbortError')
        ) {
          return;
        }
        const msg = err instanceof Error ? err.message : 'Error al consultar antecedentes';
        setError(msg);
        setLoading(false);
      }

      fetchAuditRecords(patientId);
    },
    [fetchAuditRecords]
  );

  // Filtrado y ordenación de pacientes
  const filteredPatients = useMemo(() => {
    const list = [...patients];

    const filtered = list.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono.toLowerCase().includes(searchTerm.toLowerCase());

      const isCritical =
        Boolean(p.tieneAntecedentesCriticos) ||
        Boolean(p.tiene_antecedentes_criticos) ||
        Boolean(p.alertas_criticas && p.alertas_criticas.length > 0);

      const hasAnyHistory =
        Boolean(p.tiene_antecedentes) || isCritical;

      let matchFilter = true;
      if (filterTab === 'alerts') {
        matchFilter = isCritical;
      } else if (filterTab === 'none') {
        matchFilter = !hasAnyHistory;
      }

      return matchSearch && matchFilter;
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
  }, [patients, searchTerm, filterTab, sortOrder]);

  // Selección de paciente
  const handleSelectPatient = (id: string) => {
    if (id === selectedPatientId) return;

    if (isDirty) {
      const confirmLeave = window.confirm(
        'Tienes modificaciones sin guardar en los antecedentes de este paciente. ¿Deseas descartarlas y cambiar de paciente?'
      );
      if (!confirmLeave) return;
    }

    setSelectedPatientId(id);
    currentPatientIdRef.current = id;
    fetchMedicalHistory(id);
  };

  // Detectar cambios sucios
  const isDirty = selectedPatientId
    ? JSON.stringify(formData) !== JSON.stringify(initialFormData)
    : false;

  const isInvalidDiabetes = formData.tiene_diabetes && !formData.tipo_diabetes;
  const isMotivoValid = motivo.trim().length >= 10;
  const canSave = isDirty && isMotivoValid && !isInvalidDiabetes && !saving;

  // Manejo de chips de alergias
  const handleAddAlergia = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = alergiaInput.trim();
    if (!clean) return;

    const exists = formData.alergias.some(
      (a) => a.toLowerCase() === clean.toLowerCase()
    );
    if (!exists) {
      setFormData((prev) => ({
        ...prev,
        alergias: [...prev.alergias, clean],
      }));
    }
    setAlergiaInput('');
  };

  const handleRemoveAlergia = (alergiaToRemove: string) => {
    if (!isEditing) return;
    setFormData((prev) => ({
      ...prev,
      alergias: prev.alergias.filter((a) => a !== alergiaToRemove),
    }));
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setFormData(initialFormData);
    setMotivo('');
    setIsEditing(false);
    setError(null);
  };

  // Guardar antecedentes con auditoría
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatientId = selectedPatientId;
    if (!targetPatientId || !canSave) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const payload = {
        cambios: {
          ...formData,
          tipo_diabetes: formData.tiene_diabetes ? formData.tipo_diabetes : null,
          medicacion_actual: formData.medicacion_actual?.trim() || null,
          otras_condiciones: formData.otras_condiciones?.trim() || null,
        },
        motivo: motivo.trim(),
        usuario_id: 'Dr. Odontólogo Responsable',
      };

      const res = await fetch(
        `${apiUrl}/api/patients/${targetPatientId}/medical-history`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al guardar los antecedentes médicos');
      }

      const saved: AntecedenteMedico = await res.json();

      if (currentPatientIdRef.current !== targetPatientId) {
        return;
      }

      const updatedForm: MedicalHistoryPayload = {
        tiene_diabetes: Boolean(saved.tiene_diabetes),
        tipo_diabetes: saved.tipo_diabetes,
        tiene_hipertension: Boolean(saved.tiene_hipertension),
        tiene_cardiopatia: Boolean(saved.tiene_cardiopatia),
        toma_anticoagulantes: Boolean(saved.toma_anticoagulantes),
        esta_embarazada: Boolean(saved.esta_embarazada),
        alergias: Array.isArray(saved.alergias) ? saved.alergias : [],
        medicacion_actual: saved.medicacion_actual || '',
        otras_condiciones: saved.otras_condiciones || '',
      };

      setFormData(updatedForm);
      setInitialFormData(updatedForm);
      setAlertas(saved.alertas || []);
      setHasHistory(true);
      setSaveSuccess('Antecedentes médicos y registro de auditoría guardados exitosamente.');
      setMotivo('');
      setIsEditing(false);
      setSaving(false);

      // Refrescar auditoría y lista de pacientes (para actualizar badges)
      fetchAuditRecords(targetPatientId);
      loadPatients();
    } catch (err: unknown) {
      if (currentPatientIdRef.current !== targetPatientId) return;
      const msg = err instanceof Error ? err.message : 'Error al guardar antecedentes';
      setError(msg);
      setSaving(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* 1. SELECCIÓN DE PACIENTES (Diseño directorio reutilizado) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Directorio de Pacientes — Antecedentes Médicos
            </h3>
            <p className="text-xs text-slate-500">
              Busca o filtra por condiciones críticas para abrir la ficha médica
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {filteredPatients.length} de {patients.length} pacientes
            </span>
          </div>
        </div>

        {patientLoadError && (
          <div className="flex items-center justify-between px-3 py-2 text-xs bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-md">
            <span>{patientLoadError}</span>
            <button
              type="button"
              onClick={loadPatients}
              className="ml-3 font-semibold underline hover:text-rose-900"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Barra de controles: Buscador + Filtros de Pestaña + Orden */}
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
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-[11px] transition ${
                filterTab === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('alerts')}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-[11px] transition ${
                filterTab === 'alerts'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Con alertas
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('none')}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-[11px] transition ${
                filterTab === 'none'
                  ? 'bg-white text-slate-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sin antecedentes
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

        {/* Lista interna con scroll */}
        <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/30">
          {loadingPatients ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Cargando directorio de pacientes…
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No se encontraron pacientes con los criterios de búsqueda.
            </div>
          ) : (
            filteredPatients.map((p) => {
              const isSelected = selectedPatientId === p.id;
              const isCritical =
                Boolean(p.tieneAntecedentesCriticos) ||
                Boolean(p.tiene_antecedentes_criticos) ||
                Boolean(p.alertas_criticas && p.alertas_criticas.length > 0);
              const hasHistory = Boolean(p.tiene_antecedentes) || isCritical;

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
                    </div>
                    <p className="text-[11px] text-slate-500">Tel: {p.telefono}</p>
                  </div>

                  <div>
                    {isCritical ? (
                      <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Antecedentes críticos
                      </span>
                    ) : !hasHistory ? (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Sin antecedentes
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Registrado
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Si no se ha seleccionado paciente */}
      {!selectedPatientId && !loadingPatients && (
        <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-slate-400 text-sm">
          Selecciona un paciente del directorio para visualizar o registrar sus antecedentes médicos.
        </div>
      )}

      {/* 2. PANEL DE ANTECEDENTES MÉDICOS DEL PACIENTE SELECCIONADO */}
      {selectedPatientId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Encabezado del paciente y botón Editar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Ficha Médica: {selectedPatient?.nombre}
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  ({selectedPatient?.edad} años · Tel: {selectedPatient?.telefono})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? 'Modo edición activo. Recuerda detallar el motivo de la modificación para auditoría clínica.'
                  : 'Ficha médica en modo de solo lectura protegida.'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Editar antecedentes</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Modo Edición
                </span>
              )}
            </div>
          </div>

          {/* MENSAJES DE ESTADO */}
          {error && (
            <div className="flex items-center justify-between px-4 py-3 text-xs bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-md">
              <span className="font-medium">{error}</span>
              <button
                type="button"
                onClick={() => fetchMedicalHistory(selectedPatientId)}
                className="ml-3 font-bold underline hover:text-rose-950"
              >
                Reintentar
              </button>
            </div>
          )}

          {saveSuccess && (
            <div className="px-4 py-3 text-xs bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-md font-medium flex items-center space-x-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* BANNER DE ALERTA CRÍTICA ARRIBA DEL PANEL */}
          {alertas.length > 0 ? (
            <div
              role="alert"
              className="p-4 bg-rose-50/90 border-2 border-rose-500 rounded-xl text-rose-950 shadow-xs space-y-1"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-rose-600 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-bold text-xs uppercase tracking-wider text-rose-700">
                  Alerta Crítica Pre-Atención Odontológica
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base leading-snug pl-7 break-words">
                {alertas.join(' · ')}
              </p>
              <p className="text-[11px] text-rose-700 pl-7">
                Revise cuidadosamente las dosis de anestesia local, evite alérgenos y considere profilaxis médica previa.
              </p>
            </div>
          ) : hasHistory && !loading ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 font-medium">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sin antecedentes críticos registrados para este paciente. Procedimientos rutinarios autorizados.</span>
            </div>
          ) : !hasHistory && !loading ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>Sin antecedentes registrados para este paciente. Presiona &quot;Editar antecedentes&quot; para abrir su ficha médica.</span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="font-bold text-blue-600 hover:text-blue-800 underline ml-2"
                >
                  Abrir ficha
                </button>
              )}
            </div>
          ) : null}

          {/* CUERPO DEL PANEL: SOLO LECTURA O FORMULARIO DE EDICIÓN */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Cargando antecedentes médicos del paciente…
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Sección 1: Alergias críticas */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Alergias Conocidas
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {formData.alergias.length} registrada(s)
                  </span>
                </div>

                {/* Chips de alergias */}
                <div className="flex flex-wrap gap-1.5 min-h-7">
                  {formData.alergias.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      Sin alergias declaradas
                    </span>
                  ) : (
                    formData.alergias.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"
                      >
                        {a}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAlergia(a)}
                            className="ml-1.5 text-rose-600 hover:text-rose-900 focus:outline-none"
                            aria-label={`Eliminar alergia ${a}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {/* Input para agregar nueva alergia en modo edición */}
                {isEditing && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ej: Penicilina, Látex, Lidocaína..."
                      value={alergiaInput}
                      onChange={(e) => setAlergiaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAlergia();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAlergia()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
                    >
                      + Agregar
                    </button>
                  </div>
                )}
              </div>

              {/* Sección 2: Condiciones sistémicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diabetes */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Diabetes</span>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={formData.tiene_diabetes}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            tiene_diabetes: checked,
                            tipo_diabetes: checked ? prev.tipo_diabetes || 'TIPO_2' : null,
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${formData.tiene_diabetes ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                        {formData.tiene_diabetes ? 'Sí' : 'No'}
                      </span>
                    )}
                  </div>

                  {formData.tiene_diabetes && (
                    <div className="pt-1 space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 block">
                        Tipo de diabetes:
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.tipo_diabetes || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tipo_diabetes: (e.target.value as TipoDiabetes) || null,
                            }))
                          }
                          className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="TIPO_1">Tipo 1</option>
                          <option value="TIPO_2">Tipo 2</option>
                          <option value="GESTACIONAL">Gestacional</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      ) : (
                        <span className="text-xs font-bold text-slate-800">
                          {formData.tipo_diabetes === 'TIPO_1'
                            ? 'Tipo 1'
                            : formData.tipo_diabetes === 'TIPO_2'
                            ? 'Tipo 2'
                            : formData.tipo_diabetes === 'GESTACIONAL'
                            ? 'Gestacional'
                            : 'Otro'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Hipertensión */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Hipertensión Arterial
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Monitoreo de presión pre-anestesia
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={formData.tiene_hipertension}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tiene_hipertension: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${formData.tiene_hipertension ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                      {formData.tiene_hipertension ? 'Sí' : 'No'}
                    </span>
                  )}
                </div>

                {/* Cardiopatía */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Cardiopatías
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Riesgo de endocarditis bacteriana
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={formData.tiene_cardiopatia}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tiene_cardiopatia: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${formData.tiene_cardiopatia ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                      {formData.tiene_cardiopatia ? 'Sí' : 'No'}
                    </span>
                  )}
                </div>

                {/* Anticoagulantes */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Toma Anticoagulantes
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Riesgo crítico de hemorragia en cirugía
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={formData.toma_anticoagulantes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          toma_anticoagulantes: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${formData.toma_anticoagulantes ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-200 text-slate-700'}`}>
                      {formData.toma_anticoagulantes ? 'Sí' : 'No'}
                    </span>
                  )}
                </div>

                {/* Embarazo */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between md:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Estado de Embarazo
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Restricción de radiografías periapicales y ciertos anestésicos
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={formData.esta_embarazada}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          esta_embarazada: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${formData.esta_embarazada ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                      {formData.esta_embarazada ? 'Sí' : 'No'}
                    </span>
                  )}
                </div>
              </div>

              {/* Sección 3: Medicación actual y otras observaciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Medicación Actual
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={formData.medicacion_actual || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          medicacion_actual: e.target.value,
                        }))
                      }
                      placeholder="Ej: Metformina 850mg, Losartán 50mg..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 min-h-12">
                      {formData.medicacion_actual || 'Sin medicación registrada'}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Otras Condiciones / Observaciones
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={formData.otras_condiciones || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          otras_condiciones: e.target.value,
                        }))
                      }
                      placeholder="Observaciones clínicas adicionales..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 min-h-12">
                      {formData.otras_condiciones || 'Sin observaciones adicionales'}
                    </div>
                  )}
                </div>
              </div>

              {/* MODO EDICIÓN: Campo obligatorio de Motivo y Botones de Acción */}
              {isEditing && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 pt-4">
                  <div>
                    <label
                      htmlFor="motivo-modificacion"
                      className="block text-xs font-bold text-amber-950 uppercase tracking-wide"
                    >
                      Motivo de la Modificación (Obligatorio para Auditoría Clínica) *
                    </label>
                    <p className="text-[11px] text-amber-800">
                      Todo cambio en el expediente clínico queda registrado de forma inmutable con fecha, hora y responsable.
                    </p>
                  </div>

                  <textarea
                    id="motivo-modificacion"
                    rows={2}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Especifique la justificación clínica del cambio (mínimo 10 caracteres)..."
                    className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold ${
                        motivo.trim().length >= 10
                          ? 'text-emerald-700'
                          : 'text-amber-800'
                      }`}
                    >
                      Longitud: {motivo.trim().length} de 10 caracteres mínimos requeridos
                    </span>
                    {!isDirty && (
                      <span className="text-slate-500 italic">
                        No has realizado cambios en los antecedentes.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!canSave}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition shadow-xs"
                    >
                      {saving ? 'Guardando...' : 'Guardar cambios con auditoría'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* 3. HISTORIAL DE CAMBIOS Y AUDITORÍA (Sección colapsable) */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAuditHistory((prev) => !prev)}
              className="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition text-left"
            >
              <div className="flex min-w-0 items-center gap-2">
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-800 break-words">
                  Historial de Cambios y Auditoría Clínica
                </span>
                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                  {auditRecords.length}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  showAuditHistory ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAuditHistory && (
              <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                {loadingAudit ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Cargando historial de auditoría…
                  </p>
                ) : auditRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic">
                    No hay registros de modificaciones para este paciente.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                          <th className="py-2 px-3 font-semibold">Fecha y Hora</th>
                          <th className="py-2 px-3 font-semibold">Usuario</th>
                          <th className="py-2 px-3 font-semibold">Campo</th>
                          <th className="py-2 px-3 font-semibold">Antes</th>
                          <th className="py-2 px-3 font-semibold">Después</th>
                          <th className="py-2 px-3 font-semibold">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditRecords.map((r) => {
                          const fecha = new Date(r.fecha_hora || r.fechaHora || '');
                          const fechaStr = isNaN(fecha.getTime())
                            ? '-'
                            : new Intl.DateTimeFormat('es-BO', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              }).format(fecha);

                          const fieldLabel = campoLabels[r.campo] || r.campo;

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-medium">
                                {fechaStr}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                                {r.usuario_id || r.usuarioId || 'Odontólogo Responsable'}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                {fieldLabel}
                              </td>
                              <td className="py-2.5 px-3 text-rose-700 bg-rose-50/50 rounded">
                                {r.valor_anterior || r.valorAnterior || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-800 bg-emerald-50/50 rounded font-semibold">
                                {r.valor_nuevo || r.valorNuevo || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                                {r.motivo}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
