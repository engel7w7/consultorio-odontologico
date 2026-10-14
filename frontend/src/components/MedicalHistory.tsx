import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Patient } from '../types/patient';
import type {
  AntecedenteMedico,
  MedicalHistoryPayload,
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

export const MedicalHistory: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const [formData, setFormData] = useState<MedicalHistoryPayload>(emptyForm);
  const [initialFormData, setInitialFormData] = useState<MedicalHistoryPayload>(emptyForm);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [hasHistory, setHasHistory] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [alergiaInput, setAlergiaInput] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentPatientIdRef = useRef<string>(selectedPatientId);

  // Mantener sincronizado el ref del paciente actual
  useEffect(() => {
    currentPatientIdRef.current = selectedPatientId;
  }, [selectedPatientId]);

  // Limpiar abort controller al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Cargar lista de pacientes al iniciar o al reintentar
  useEffect(() => {
    let ignore = false;
    const fetchList = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const res = await fetch(`${apiUrl}/api/patients`);
        if (!res.ok) {
          throw new Error('Error al cargar la lista de pacientes');
        }
        const data: Patient[] = await res.json();
        if (!ignore) {
          const sorted = [...data].sort((a, b) => a.nombre.localeCompare(b.nombre));
          setPatients(sorted);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Error al cargar pacientes';
          setPatientLoadError(msg);
        }
      } finally {
        if (!ignore) {
          setLoadingPatients(false);
        }
      }
    };

    fetchList();

    return () => {
      ignore = true;
    };
  }, [retryTrigger]);

  const handleRetryPatients = () => {
    setPatientLoadError(null);
    setLoadingPatients(true);
    setRetryTrigger((prev) => prev + 1);
  };

  // Función para consultar antecedentes de un paciente
  const fetchMedicalHistory = useCallback(async (patientId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    // Limpiar de inmediato el formulario para evitar mezclar datos
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

      // Segunda defensa: comprobar si el paciente en pantalla sigue siendo el mismo
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
      if (currentPatientIdRef.current !== patientId) {
        return;
      }
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
  }, []);

  // Validación de diabetes: si tiene diabetes, debe indicar el tipo
  const isInvalidDiabetes = formData.tiene_diabetes && !formData.tipo_diabetes;

  // Detectar cambios sin guardar
  const isDirty = useMemo(() => {
    if (!selectedPatientId) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData, selectedPatientId]);

  // Manejar cambio de paciente en el selector
  const handlePatientSelectChange = (newPatientId: string) => {
    if (newPatientId === selectedPatientId) return;

    if (isDirty) {
      const confirmLeave = window.confirm(
        'Tienes cambios sin guardar en los antecedentes de este paciente. ¿Deseas descartarlos y cambiar de paciente?'
      );
      if (!confirmLeave) return;
    }

    currentPatientIdRef.current = newPatientId;
    setSelectedPatientId(newPatientId);
    setSaveSuccess(false);

    if (newPatientId) {
      fetchMedicalHistory(newPatientId);
    } else {
      setFormData(emptyForm);
      setInitialFormData(emptyForm);
      setAlertas([]);
      setHasHistory(false);
    }
  };

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
    setFormData((prev) => ({
      ...prev,
      alergias: prev.alergias.filter((a) => a !== alergiaToRemove),
    }));
  };

  // Guardar (PUT upsert)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatientId = selectedPatientId;
    if (!targetPatientId || !isDirty || saving || isInvalidDiabetes) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const payload: MedicalHistoryPayload = {
        ...formData,
        tipo_diabetes: formData.tiene_diabetes ? formData.tipo_diabetes : null,
        medicacion_actual: formData.medicacion_actual?.trim() || null,
        otras_condiciones: formData.otras_condiciones?.trim() || null,
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

      // Descartar si el odontólogo cambió de paciente durante el guardado
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
      setSaveSuccess(true);
      setSaving(false);
    } catch (err: unknown) {
      if (currentPatientIdRef.current !== targetPatientId) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Error al guardar antecedentes';
      setError(msg);
      setSaving(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      {/* Encabezado clínico sobrio */}
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Antecedentes médicos
        </h2>
      </div>

      {/* Error al cargar la lista de pacientes con reintento */}
      {patientLoadError && (
        <div className="flex items-center justify-between px-3 py-2 text-xs bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-md">
          <span>{patientLoadError}</span>
          <button
            type="button"
            onClick={handleRetryPatients}
            className="ml-3 font-medium underline hover:text-rose-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Selector de paciente */}
      <div className="space-y-1.5 max-w-md">
        <label
          htmlFor="patient-select"
          className="block text-sm font-medium text-slate-700"
        >
          Paciente
        </label>
        <select
          id="patient-select"
          value={selectedPatientId}
          disabled={loadingPatients || saving}
          onChange={(e) => handlePatientSelectChange(e.target.value)}
          className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="">
            {loadingPatients
              ? 'Cargando directorio de pacientes…'
              : 'Seleccione un paciente de la lista…'}
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {p.edad} años
            </option>
          ))}
        </select>
      </div>

      {/* Aviso de error con reintento */}
      {error && (
        <div className="flex items-center justify-between px-3 py-2 text-xs bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-md">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              if (selectedPatientId) fetchMedicalHistory(selectedPatientId);
            }}
            className="ml-3 font-medium underline hover:text-rose-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Si no se ha seleccionado paciente */}
      {!selectedPatientId && !loadingPatients && (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
          Selecciona un paciente del directorio para visualizar o registrar sus antecedentes médicos.
        </div>
      )}

      {/* Área del paciente seleccionado */}
      {selectedPatientId && (
        <div
          className={`space-y-5 transition-opacity duration-150 ${
            loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* 1. Franja de alertas críticas */}
          {alertas.length > 0 && (
            <div
              role="alert"
              className="px-4 py-2.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-md text-sm text-rose-900 leading-relaxed"
            >
              <span>
                <span className="font-semibold">{alertas[0]}</span>
                {alertas.length > 1 && ` · ${alertas.slice(1).join(' · ')}`}
              </span>
            </div>
          )}

          {/* Estado sin antecedentes registrados */}
          {!loading && !hasHistory && (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-2.5 rounded-md">
              Sin antecedentes registrados para {selectedPatient?.nombre}. Completa el formulario a continuación para abrir su ficha médica.
            </div>
          )}

          {/* 2. Formulario de antecedentes */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* Grupo de condiciones sistémicas */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700">
                Condiciones sistémicas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {/* Diabetes */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      id="cond-diabetes"
                      type="checkbox"
                      checked={formData.tiene_diabetes}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({
                          ...formData,
                          tiene_diabetes: checked,
                          tipo_diabetes: checked ? formData.tipo_diabetes : null,
                        });
                      }}
                      className="rounded border-slate-300 text-slate-700 accent-slate-700 focus:ring-slate-400 h-4 w-4"
                    />
                    <span className="text-sm text-slate-800">
                      Diabetes
                    </span>
                  </label>

                  {formData.tiene_diabetes && (
                    <div className="pl-6 pt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1 max-w-xs">
                        <label
                          htmlFor="tipo-diabetes"
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Tipo de diabetes
                        </label>
                        <select
                          id="tipo-diabetes"
                          value={formData.tipo_diabetes || ''}
                          onChange={(e) => {
                            const val = e.target.value as TipoDiabetes | '';
                            setFormData({
                              ...formData,
                              tipo_diabetes: val ? (val as TipoDiabetes) : null,
                            });
                          }}
                          className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                          <option value="">Seleccione el tipo…</option>
                          <option value="TIPO_1">Tipo 1</option>
                          <option value="TIPO_2">Tipo 2</option>
                          <option value="GESTACIONAL">Gestacional</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                      {isInvalidDiabetes && (
                        <span className="text-xs text-rose-700 font-medium sm:pt-4">
                          Indique el tipo de diabetes
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Hipertensión */}
                <div>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      id="cond-hipertension"
                      type="checkbox"
                      checked={formData.tiene_hipertension}
                      onChange={(e) =>
                        setFormData({ ...formData, tiene_hipertension: e.target.checked })
                      }
                      className="rounded border-slate-300 text-slate-700 accent-slate-700 focus:ring-slate-400 h-4 w-4"
                    />
                    <span className="text-sm text-slate-800">
                      Hipertensión arterial
                    </span>
                  </label>
                </div>

                {/* Cardiopatía */}
                <div>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      id="cond-cardiopatia"
                      type="checkbox"
                      checked={formData.tiene_cardiopatia}
                      onChange={(e) =>
                        setFormData({ ...formData, tiene_cardiopatia: e.target.checked })
                      }
                      className="rounded border-slate-300 text-slate-700 accent-slate-700 focus:ring-slate-400 h-4 w-4"
                    />
                    <span className="text-sm text-slate-800">
                      Cardiopatía
                    </span>
                  </label>
                </div>

                {/* Anticoagulantes */}
                <div>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      id="cond-anticoagulantes"
                      type="checkbox"
                      checked={formData.toma_anticoagulantes}
                      onChange={(e) =>
                        setFormData({ ...formData, toma_anticoagulantes: e.target.checked })
                      }
                      className="rounded border-slate-300 text-slate-700 accent-slate-700 focus:ring-slate-400 h-4 w-4"
                    />
                    <span className="text-sm text-slate-800">
                      Toma anticoagulantes
                    </span>
                  </label>
                </div>

                {/* Embarazo */}
                <div>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      id="cond-embarazo"
                      type="checkbox"
                      checked={formData.esta_embarazada}
                      onChange={(e) =>
                        setFormData({ ...formData, esta_embarazada: e.target.checked })
                      }
                      className="rounded border-slate-300 text-slate-700 accent-slate-700 focus:ring-slate-400 h-4 w-4"
                    />
                    <span className="text-sm text-slate-800">
                      Embarazo
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Grupo de Alergias */}
            <div className="space-y-2">
              <label
                htmlFor="input-alergia"
                className="block text-sm font-medium text-slate-700"
              >
                Alergias conocidas (fármacos, materiales, anestésicos)
              </label>

              <div className="flex gap-2">
                <input
                  id="input-alergia"
                  type="text"
                  value={alergiaInput}
                  onChange={(e) => setAlergiaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAlergia();
                    }
                  }}
                  placeholder="Ej: Penicilina, Látex, Lidocaína (Enter para agregar)"
                  className="flex-1 text-sm border border-slate-300 rounded-md p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleAddAlergia()}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Agregar
                </button>
              </div>

              {/* Lista de chips */}
              <div className="flex flex-wrap gap-2 pt-1 min-h-[28px]">
                {formData.alergias.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Sin alergias registradas
                  </span>
                ) : (
                  formData.alergias.map((alergia) => (
                    <span
                      key={alergia}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      <span>{alergia}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlergia(alergia)}
                        aria-label={`Quitar alergia a ${alergia}`}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300 rounded leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Medicación actual */}
            <div className="space-y-1">
              <label
                htmlFor="medicacion-actual"
                className="block text-sm font-medium text-slate-700"
              >
                Medicación actual
              </label>
              <textarea
                id="medicacion-actual"
                rows={2}
                value={formData.medicacion_actual || ''}
                onChange={(e) =>
                  setFormData({ ...formData, medicacion_actual: e.target.value })
                }
                placeholder="Dosis y fármacos en consumo regular por el paciente..."
                className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              />
            </div>

            {/* Otras condiciones */}
            <div className="space-y-1">
              <label
                htmlFor="otras-condiciones"
                className="block text-sm font-medium text-slate-700"
              >
                Otras condiciones
              </label>
              <textarea
                id="otras-condiciones"
                rows={2}
                value={formData.otras_condiciones || ''}
                onChange={(e) =>
                  setFormData({ ...formData, otras_condiciones: e.target.value })
                }
                placeholder="Cirugías previas, hemofilia, precauciones de anestesia u observaciones relevantes..."
                className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              />
            </div>

            {/* Botón de guardar y confirmación */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!isDirty || saving || isInvalidDiabetes}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>

              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-medium">
                  Guardado
                </span>
              )}

              {isDirty && !saving && !isInvalidDiabetes && (
                <span className="text-xs text-amber-600">
                  Hay cambios sin guardar
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
