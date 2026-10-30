import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Patient } from '../types/patient';
import type { HistorialPaciente, OrdenHistorial } from '../types/patient-history';

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

  // La carga se dispara desde los eventos del usuario (no desde un useEffect)
  // para evitar setState síncrono dentro de un efecto y renders en cascada.
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    void fetchHistory(patientId, orden);
  };

  const handleChangeOrden = (nuevoOrden: OrdenHistorial) => {
    setOrden(nuevoOrden);
    if (selectedPatientId) void fetchHistory(selectedPatientId, nuevoOrden);
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || historial?.patient;

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

      {/* 2. LÍNEA DE TIEMPO DE TRATAMIENTOS */}
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
                  <li key={t.id} data-testid="tratamiento-item" className="ml-5">
                    <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                    <time dateTime={t.fecha} className="block text-[11px] font-semibold text-slate-500">
                      {fechaFormatter.format(new Date(t.fecha))}
                    </time>
                    <p className="text-sm font-bold text-slate-900">{t.procedimiento}</p>
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
