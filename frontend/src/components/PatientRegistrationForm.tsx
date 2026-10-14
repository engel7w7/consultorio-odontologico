import React, { useState, useEffect, useCallback } from 'react';
import type { Patient } from '../types/patient';

interface PatientRegistrationFormProps {
  onPatientAdded?: (patient: Patient) => void;
  onSelectForValidation?: (patientId: string) => void;
}

export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  onPatientAdded,
  onSelectForValidation,
}) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [edad, setEdad] = useState<number | ''>('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Directorio de contactos
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoadingDirectory(true);
    setDirectoryError(null);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/patients`);
      if (!response.ok) {
        throw new Error('No se pudo cargar el directorio');
      }
      const data: Patient[] = await response.json();
      setPatients(data);
    } catch {
      setDirectoryError('No se pudo sincronizar el directorio de contactos');
    } finally {
      setLoadingDirectory(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setIsSubmitting(true);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, edad: Number(edad) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al registrar paciente');
      }

      const createdPatient: Patient = await response.json();

      setMensaje({ tipo: 'ok', texto: 'Paciente registrado exitosamente en el sistema' });
      setNombre('');
      setTelefono('');
      setEdad('');

      // Actualizar el directorio localmente y volver a sincronizar
      setPatients((prev) => [createdPatient, ...prev]);
      if (onPatientAdded) onPatientAdded(createdPatient);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.telefono.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      {/* Resumen de Métricas del Directorio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            👥
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total de Pacientes</p>
            <p className="text-xl font-bold text-slate-800">{patients.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🟢
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Con Luz Verde Médica</p>
            <p className="text-xl font-bold text-slate-800">
              {patients.filter((p) => p.examenes_sangre_validados).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            ⚠️
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Exámenes Pendientes</p>
            <p className="text-xl font-bold text-slate-800">
              {patients.filter((p) => !p.examenes_sangre_validados).length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Registro */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Registrar Nuevo Paciente</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa los datos para incorporar al paciente al directorio de contacto del consultorio.
            </p>
          </div>

          {mensaje && (
            <div
              className={`p-3.5 rounded-lg text-sm border flex items-start space-x-2.5 transition-all ${
                mensaje.tipo === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span className="text-base">{mensaje.tipo === 'ok' ? '✓' : '⚠️'}</span>
              <span className="font-medium">{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Ej: Ana García"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Ej: 77712345"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Edad
              </label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={edad}
                onChange={(e) => setEdad(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                placeholder="Ej: 28"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Guardando...' : 'Guardar en Directorio'}</span>
            </button>
          </form>
        </div>

        {/* Directorio de Contactos en Tiempo Real */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Directorio de Pacientes</h3>
              <p className="text-xs text-slate-500">Contactos disponibles para consulta y atención clínica</p>
            </div>
            <button
              onClick={fetchPatients}
              disabled={loadingDirectory}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>{loadingDirectory ? '↻ Actualizando...' : '↻ Refrescar'}</span>
            </button>
          </div>

          {/* Buscador de Contactos */}
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Buscar por nombre o teléfono..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {directoryError && (
            <div className="p-3 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200">
              {directoryError}
            </div>
          )}

          {/* Lista de Pacientes */}
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">
                  {searchTerm
                    ? 'No se encontraron pacientes que coincidan con la búsqueda.'
                    : 'Aún no hay pacientes en el directorio. Registra el primero en el formulario.'}
                </p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100/70 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                      {patient.nombre
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{patient.nombre}</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>📞 {patient.telefono}</span>
                        <span>•</span>
                        <span>{patient.edad} años</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {patient.examenes_sangre_validados ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Luz Verde
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ○ Exámenes Pendientes
                      </span>
                    )}

                    {onSelectForValidation && (
                      <button
                        onClick={() => onSelectForValidation(patient.id)}
                        className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                        title="Ver control pre-operatorio"
                      >
                        Validar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
