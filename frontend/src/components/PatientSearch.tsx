import { useEffect, useRef, useState, type FC } from 'react';
import type { Patient } from '../types/patient';

export const PatientSearch: FC = () => {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      setError(null);

      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
        const response = await fetch(`${apiUrl}/api/patients${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al buscar pacientes');
        }

        setPatients(await response.json());
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setPatients([]);
        setError(err instanceof Error ? err.message : 'Error de conexión con el servidor');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      requestRef.current?.abort();
    };
  }, [search]);

  return (
    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Buscador de pacientes (HU-12)</h2>
        <p className="text-sm text-slate-500">
          Busca por nombre o teléfono para abrir rápidamente la ficha médica.
        </p>
      </div>

      <label className="block text-sm font-medium text-slate-700" htmlFor="patient-search">
        Nombre o teléfono
        <input
          id="patient-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ej: Ana García o 77712345"
          className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {loading && <p className="text-sm text-slate-500">Buscando pacientes...</p>}
      {error && <p className="p-3 text-sm bg-red-100 text-red-800 rounded">{error}</p>}
      {!loading && !error && patients.length === 0 && (
        <p className="text-sm text-slate-500">No se encontraron pacientes.</p>
      )}

      {patients.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
          {patients.map((patient) => (
            <li key={patient.id} className="p-3 flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="font-medium text-slate-800">{patient.nombre}</span>
              <span className="text-sm text-slate-500">{patient.telefono}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
