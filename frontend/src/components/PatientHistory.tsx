import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Patient } from '../types/patient';
import type { HistorialPaciente, OrdenHistorial } from '../types/patient-history';
import { parseQuickTreatment } from '../utils/fdi-notation.utils';

const getApiUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const fechaFormatter = new Intl.DateTimeFormat('es-BO', {
  timeZone: 'America/La_Paz',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const PatientHistory: React.FC = () => {
  // Directorio de pacientes
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Historial del paciente seleccionado
  const [historial, setHistorial] = useState<HistorialPaciente | null>(null);
  const [orden, setOrden] = useState<OrdenHistorial>('desc');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Registro de Tratamiento con Nomenclatura Rápida (HU-09)
  const [nomenclatura, setNomenclatura] = useState<string>('');
  const [submittingTreatment, setSubmittingTreatment] = useState<boolean>(false);
  const [treatmentError, setTreatmentError] = useState<string | null>(null);
  const [treatmentSuccess, setTreatmentSuccess] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Cargar directorio de pacientes (con búsqueda de HU-12)
  const loadPatients = useCallback(async (search: string) => {
    try {
      setLoadingPatients(true);
      setPatientLoadError(null);
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const res = await fetch(`${getApiUrl()}/api/patients${query}`);
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
    const timer = setTimeout(() => {
      loadPatients(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadPatients]);

  // Consultar historial; aborta la petición anterior para no mezclar pacientes
  const fetchHistory = useCallback(async (patientId: string, ordenActual: OrdenHistorial) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setHistorial(null);

    try {
      const res = await fetch(
        `${getApiUrl()}/api/patients/${patientId}/history?orden=${ordenActual}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al consultar el historial de tratamientos');
      }

      const data: HistorialPaciente = await res.json();
      setHistorial(data);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Error al consultar el historial';
      setError(msg);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setTreatmentError(null);
    setTreatmentSuccess(null);
    void fetchHistory(patientId, orden);
  };

  const handleChangeOrden = (nuevoOrden: OrdenHistorial) => {
    setOrden(nuevoOrden);
    if (selectedPatientId) void fetchHistory(selectedPatientId, nuevoOrden);
  };

  const patientRecord = patients.find((p) => p.id === selectedPatientId);
  const selectedPatient = patientRecord || historial?.patient;

  // HU-09: Previsualización en tiempo real de nomenclatura rápida (ISO 3950 FDI + CIE-10)
  const parsedPreview = useMemo(() => {
    return parseQuickTreatment(nomenclatura);
  }, [nomenclatura]);

  const isSafetyExtractionBlocked = useMemo(() => {
    if (!patientRecord || patientRecord.examenes_sangre_validados) return false;
    return (
      /extracc|exodoncia|cirug|quir[uú]rg|muela|molar/i.test(nomenclatura) ||
      parsedPreview.cie10 === 'K08.1'
    );
  }, [patientRecord, nomenclatura, parsedPreview]);

  const handleRegisterTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !nomenclatura.trim()) return;

    if (isSafetyExtractionBlocked) {
      setTreatmentError(
        'ALERTA ROJA BLOQUEANTE: No se puede registrar una extracción sin exámenes de sangre validados.'
      );
      return;
    }

    setSubmittingTreatment(true);
    setTreatmentError(null);
    setTreatmentSuccess(null);

    try {
      const res = await fetch(`${getApiUrl()}/api/patients/${selectedPatientId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomenclatura_rapida: nomenclatura.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar el tratamiento');
      }

      setTreatmentSuccess('Tratamiento registrado correctamente en el historial clínico.');
      setNomenclatura('');
      void fetchHistory(selectedPatientId, orden);
      setTimeout(() => setTreatmentSuccess(null), 3000);
    } catch (err: unknown) {
      setTreatmentError(err instanceof Error ? err.message : 'Error inesperado al registrar');
    } finally {
      setSubmittingTreatment(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. DIRECTORIO DE PACIENTES */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1 h-fit">
        <div>
          <h2 className="text-base font-bold text-slate-900">Pacientes</h2>
          <p className="text-xs text-slate-500">
            Selecciona un paciente para ver su historial de tratamientos.
          </p>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          aria-label="Buscar paciente"
          className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />

        <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/30">
          {loadingPatients ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Cargando directorio de pacientes…
            </div>
          ) : patientLoadError ? (
            <div className="p-6 text-center text-xs text-rose-600">{patientLoadError}</div>
          ) : patients.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No se encontraron pacientes con los criterios de búsqueda.
            </div>
          ) : (
            patients.map((p) => {
              const isSelected = selectedPatientId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPatient(p.id)}
                  className={`w-full p-3 text-left transition ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-blue-600'
                      : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{p.nombre}</span>
                    <span className="text-[11px] text-slate-500">({p.edad} años)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Tel: {p.telefono}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. LÍNEA DE TIEMPO DE TRATAMIENTOS Y REGISTRO RÁPIDO */}
      <div className="lg:col-span-2">
        {!selectedPatientId ? (
          <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-slate-400 text-sm">
            Selecciona un paciente del directorio para visualizar su historial clínico de tratamientos.
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Historial Clínico: {selectedPatient?.nombre}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedPatient?.edad} años · Tel: {selectedPatient?.telefono}
                  {historial && ` · ${historial.total} tratamiento${historial.total === 1 ? '' : 's'}`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="orden-historial"
                  className="text-[11px] font-medium text-slate-500 whitespace-nowrap"
                >
                  Orden:
                </label>
                <select
                  id="orden-historial"
                  value={orden}
                  onChange={(e) => handleChangeOrden(e.target.value as OrdenHistorial)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="desc">Más reciente primero</option>
                  <option value="asc">Más antiguo primero</option>
                </select>
              </div>
            </div>

            {/* HU-09: FORMULARIO DE NOMENCLATURA RÁPIDA (Adaptado al flujo real del odontólogo) */}
            <form onSubmit={handleRegisterTreatment} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="nomenclatura-input" className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Registrar Tratamiento (Nomenclatura Rápida)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  ISO 3950 (FDI) · CIE-10 · SNODENT
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="nomenclatura-input"
                  type="text"
                  value={nomenclatura}
                  onChange={(e) => setNomenclatura(e.target.value)}
                  placeholder="Ej: 11 Caries, 1A Caries, 24 OD Resina, 36 MOD Amalgama, 48 Exodoncia..."
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  disabled={submittingTreatment}
                />
                <button
                  type="submit"
                  disabled={submittingTreatment || !nomenclatura.trim() || isSafetyExtractionBlocked}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap ${
                    isSafetyExtractionBlocked
                      ? 'bg-rose-300 text-white cursor-not-allowed border border-rose-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  }`}
                >
                  {submittingTreatment ? 'Registrando…' : 'Registrar Tratamiento'}
                </button>
              </div>

              {/* Botones rápidos de nomenclatura médica frecuente */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 mr-1">Atajos rápidos:</span>
                {[
                  { label: '11 Caries', code: '11 Caries' },
                  { label: '1A Caries', code: '1A Caries' },
                  { label: '24 OD Resina', code: '24 OD Resina' },
                  { label: '36 MOD Amalgama', code: '36 MOD Amalgama' },
                  { label: '16 Endodoncia', code: '16 Endodoncia' },
                  { label: '48 Exodoncia', code: '48 Exodoncia' },
                  { label: 'Profilaxis general', code: 'Profilaxis dental' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setNomenclatura(item.code)}
                    className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition font-mono"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Previsualización clínica en tiempo real (HU-09) */}
              {nomenclatura.trim() && (
                <div className="p-3 bg-white border border-blue-100 rounded-lg space-y-1.5 animate-in fade-in duration-100">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {parsedPreview.pieza_fdi && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Pieza FDI: {parsedPreview.pieza_fdi}
                      </span>
                    )}
                    {parsedPreview.superficie && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Caras: {parsedPreview.superficie}
                      </span>
                    )}
                    {parsedPreview.cie10 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        CIE-10: {parsedPreview.cie10} ({parsedPreview.diagnostico})
                      </span>
                    )}
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500">
                      Duración estimada: {parsedPreview.duracion_minutos} min
                    </span>
                  </div>

                  {parsedPreview.diente_nombre && (
                    <p className="text-xs text-slate-700 font-medium">
                      Anatomía: <span className="font-semibold">{parsedPreview.diente_nombre}</span>
                    </p>
                  )}

                  <p className="text-xs text-slate-600">
                    Descripción generada: <strong className="text-slate-900 font-mono">{parsedPreview.descripcion_clinica}</strong>
                  </p>
                </div>
              )}

              {/* Alerta de bloqueo pre-quirúrgico */}
              {isSafetyExtractionBlocked && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-900">
                    <span className="w-2 h-2 rounded-full bg-rose-600" aria-hidden="true"></span>
                    Alerta Roja Bloqueante de Seguridad Clínica
                  </div>
                  <p>
                    No se puede registrar una extracción dental sin exámenes de sangre validados para este paciente.
                  </p>
                </div>
              )}

              {treatmentError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                  {treatmentError}
                </div>
              )}

              {treatmentSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-medium">
                  {treatmentSuccess}
                </div>
              )}
            </form>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Cargando historial de tratamientos…
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            ) : historial && historial.tratamientos.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl text-slate-400 text-sm">
                Sin tratamientos registrados
              </div>
            ) : historial ? (
              <ol aria-label="Línea de tiempo de tratamientos" className="relative border-l-2 border-blue-100 ml-2 space-y-5">
                {historial.tratamientos.map((t) => (
                  <li key={t.id} data-testid="tratamiento-item" className="ml-5 space-y-1">
                    <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                    <div className="flex flex-wrap items-center gap-2">
                      <time dateTime={t.fecha} className="block text-[11px] font-semibold text-slate-500">
                        {fechaFormatter.format(new Date(t.fecha))}
                      </time>
                      {t.pieza_fdi && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Pieza FDI: {t.pieza_fdi}
                        </span>
                      )}
                      {t.superficie && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          Caras: {t.superficie}
                        </span>
                      )}
                      {t.cie10 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          CIE-10: {t.cie10}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900">{t.procedimiento}</p>
                    {t.diente_nombre && (
                      <p className="text-xs text-slate-600 font-medium">
                        {t.diente_nombre}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">Duración: {t.duracion_minutos} min</p>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
