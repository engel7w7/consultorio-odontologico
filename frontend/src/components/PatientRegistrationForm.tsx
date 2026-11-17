import React, { useState, useEffect, useCallback } from 'react';
import type { Patient } from '../types/patient';
import { Modal } from './Modal';
import { Toast } from './Toast';

interface PatientRegistrationFormProps {
  onPatientAdded?: (patient: Patient) => void;
  onSelectForValidation?: (patientId: string) => void;
}

type CampoPaciente = 'nombre' | 'telefono' | 'edad';
type ErroresPaciente = Partial<Record<CampoPaciente, string>>;
type FiltroEstado = 'todos' | 'luz-verde' | 'pendientes';

const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const TELEFONO_REGEX = /^\d{8}$/;
const EDAD_MIN = 1;
const EDAD_MAX = 110;

// Validación solo para registros nuevos; los pacientes existentes no se validan
const validarPaciente = (nombre: string, telefono: string, edad: number | ''): ErroresPaciente => {
  const errores: ErroresPaciente = {};

  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) {
    errores.nombre = 'El nombre es obligatorio';
  } else if (nombreLimpio.length < 3) {
    errores.nombre = 'El nombre debe tener al menos 3 caracteres';
  } else if (!NOMBRE_REGEX.test(nombreLimpio)) {
    errores.nombre = 'El nombre solo puede contener letras y espacios';
  }

  const telefonoLimpio = telefono.trim();
  if (!telefonoLimpio) {
    errores.telefono = 'El teléfono es obligatorio';
  } else if (!TELEFONO_REGEX.test(telefonoLimpio)) {
    errores.telefono = 'El teléfono debe tener exactamente 8 dígitos numéricos';
  }

  if (edad === '') {
    errores.edad = 'La edad es obligatoria';
  } else if (!Number.isInteger(edad) || edad < EDAD_MIN || edad > EDAD_MAX) {
    errores.edad = `La edad debe ser un número entero entre ${EDAD_MIN} y ${EDAD_MAX}`;
  }

  return errores;
};

const capitalizarNombre = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');

const inputClassName = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 transition ${
    hasError
      ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-500'
      : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
  }`;

// Colores suaves de avatar, asignados de forma estable según el nombre
const AVATAR_TONOS = [
  'bg-blue-100 text-blue-700',
  'bg-cyan-100 text-cyan-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

const tonoAvatar = (nombre: string) => {
  let hash = 0;
  for (const letra of nombre) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  return AVATAR_TONOS[hash % AVATAR_TONOS.length];
};

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  onPatientAdded,
  onSelectForValidation,
}) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [edad, setEdad] = useState<number | ''>('');
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [camposTocados, setCamposTocados] = useState<Partial<Record<CampoPaciente, boolean>>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Directorio de contactos
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  const errores = validarPaciente(nombre, telefono, edad);
  const errorVisible = (campo: CampoPaciente) => (camposTocados[campo] ? errores[campo] : undefined);
  const marcarTocado = (campo: CampoPaciente) =>
    setCamposTocados((prev) => ({ ...prev, [campo]: true }));

  const fetchPatients = useCallback(async () => {
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
    const timer = setTimeout(() => {
      void fetchPatients();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  const abrirModal = () => {
    setErrorEnvio(null);
    setCamposTocados({});
    setIsModalOpen(true);
  };

  const cerrarModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  }, [isSubmitting]);

  const ocultarToast = useCallback(() => setToastMessage(null), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio(null);
    setCamposTocados({ nombre: true, telefono: true, edad: true });

    if (Object.keys(errores).length > 0) return;

    setIsSubmitting(true);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: capitalizarNombre(nombre),
          telefono: telefono.trim(),
          edad: Number(edad),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al registrar paciente');
      }

      const createdPatient: Patient = await response.json();

      setToastMessage('Paciente registrado exitosamente en el sistema');
      setNombre('');
      setTelefono('');
      setEdad('');
      setCamposTocados({});
      setIsModalOpen(false);

      // Actualizar el directorio localmente y sincronizar
      setPatients((prev) => [createdPatient, ...prev]);
      if (onPatientAdded) onPatientAdded(createdPatient);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorEnvio(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLuzVerde = patients.filter((p) => p.examenes_sangre_validados).length;
  const totalPendientes = patients.length - totalLuzVerde;
  const porcentajeLuzVerde = patients.length ? Math.round((totalLuzVerde / patients.length) * 100) : 0;

  const filteredPatients = patients.filter(
    (p) =>
      (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono.includes(searchTerm)) &&
      (filtroEstado === 'todos' ||
        (filtroEstado === 'luz-verde' ? p.examenes_sangre_validados : !p.examenes_sangre_validados))
  );

  const filtros: { id: FiltroEstado; label: string; total: number }[] = [
    { id: 'todos', label: 'Todos', total: patients.length },
    { id: 'luz-verde', label: 'Luz verde', total: totalLuzVerde },
    { id: 'pendientes', label: 'Pendientes', total: totalPendientes },
  ];

  const hayFiltrosActivos = searchTerm !== '' || filtroEstado !== 'todos';

  return (
    <div className="space-y-6">
      {/* Encabezado de la página con resumen del directorio */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white p-6 sm:p-8 shadow-lg shadow-blue-600/20">
        <svg
          className="hidden sm:block absolute right-40 -bottom-16 w-48 h-48 text-white/[0.07] rotate-12 pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M7 3C4.5 3 3 5 3 7.5c0 2 .7 3.3 1.3 5 .6 1.8.7 4 1.2 6.2.3 1.4.9 2.3 1.8 2.3 1.1 0 1.4-1.3 1.7-3 .3-1.6.6-3 2-3s1.7 1.4 2 3c.3 1.7.6 3 1.7 3 .9 0 1.5-.9 1.8-2.3.5-2.2.6-4.4 1.2-6.2.6-1.7 1.3-3 1.3-5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z" />
        </svg>

        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
              Directorio clínico
            </p>
            <h2 className="font-display text-3xl font-extrabold mt-1">Pacientes</h2>
            <p className="text-sm text-blue-100 mt-1.5 max-w-md">
              Consulta quién está listo para su procedimiento y registra nuevos pacientes.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModal}
            className="bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-900/20 transition flex items-center justify-center gap-1.5 self-start focus:outline-none focus:ring-4 focus:ring-white/40"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo paciente</span>
          </button>
        </div>

        {/* Resumen de Métricas del Directorio */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-4">
            <p className="text-xs text-blue-100 font-medium">Total de Pacientes</p>
            <p className="font-display text-3xl font-bold mt-1">{patients.length}</p>
          </div>

          <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-blue-100 font-medium">Con Luz Verde Médica</p>
              <span className="text-[11px] font-semibold text-emerald-100">{porcentajeLuzVerde}%</span>
            </div>
            <p className="font-display text-3xl font-bold mt-1">{totalLuzVerde}</p>
            <div
              className="mt-2.5 h-1.5 rounded-full bg-white/20 overflow-hidden"
              role="progressbar"
              aria-label="Pacientes con luz verde médica"
              aria-valuenow={porcentajeLuzVerde}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${porcentajeLuzVerde}%` }} />
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-4">
            <p className="text-xs text-blue-100 font-medium">Exámenes Pendientes</p>
            <p className="font-display text-3xl font-bold mt-1">{totalPendientes}</p>
            <p className="text-[11px] text-blue-100 mt-1.5">Requieren validación antes de cirugía</p>
          </div>
        </div>
      </header>

      {/* Formulario de Registro en modal */}
      <Modal
        isOpen={isModalOpen}
        title="Registrar Nuevo Paciente"
        description="Ingresa los datos del paciente para incorporarlo al directorio activo del consultorio."
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        }
        onClose={cerrarModal}
      >
        {errorEnvio && (
          <div
            role="alert"
            className="p-3.5 rounded-xl text-sm border flex items-start space-x-2.5 transition-all bg-rose-50 border-rose-200 text-rose-800"
          >
            <div className="shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-medium text-xs leading-relaxed">{errorEnvio}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="paciente-nombre" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nombre Completo
            </label>
            <input
              id="paciente-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => marcarTocado('nombre')}
              aria-invalid={Boolean(errorVisible('nombre'))}
              aria-describedby={errorVisible('nombre') ? 'paciente-nombre-error' : undefined}
              className={inputClassName(Boolean(errorVisible('nombre')))}
              placeholder="Ej: Ana García"
            />
            {errorVisible('nombre') && (
              <p id="paciente-nombre-error" className="mt-1.5 text-xs text-rose-600">
                {errorVisible('nombre')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="sm:col-span-3">
              <label htmlFor="paciente-telefono" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Teléfono de Contacto
              </label>
              <input
                id="paciente-telefono"
                type="text"
                inputMode="numeric"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onBlur={() => marcarTocado('telefono')}
                aria-invalid={Boolean(errorVisible('telefono'))}
                aria-describedby={errorVisible('telefono') ? 'paciente-telefono-error' : 'paciente-telefono-ayuda'}
                className={inputClassName(Boolean(errorVisible('telefono')))}
                placeholder="Ej: 77712345"
              />
              {errorVisible('telefono') ? (
                <p id="paciente-telefono-error" className="mt-1.5 text-xs text-rose-600">
                  {errorVisible('telefono')}
                </p>
              ) : (
                <p id="paciente-telefono-ayuda" className="mt-1.5 text-xs text-slate-400">
                  8 dígitos, sin espacios
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="paciente-edad" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Edad
              </label>
              <input
                id="paciente-edad"
                type="number"
                required
                min={EDAD_MIN}
                max={EDAD_MAX}
                step="1"
                value={edad}
                onChange={(e) => setEdad(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={() => marcarTocado('edad')}
                aria-invalid={Boolean(errorVisible('edad'))}
                aria-describedby={errorVisible('edad') ? 'paciente-edad-error' : undefined}
                className={inputClassName(Boolean(errorVisible('edad')))}
                placeholder="Ej: 28"
              />
              {errorVisible('edad') && (
                <p id="paciente-edad-error" className="mt-1.5 text-xs text-rose-600">
                  {errorVisible('edad')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={isSubmitting}
              className="sm:flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2.5 px-4 rounded-xl transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              <span>{isSubmitting ? 'Guardando...' : 'Guardar en Directorio'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onDismiss={ocultarToast} />

      {/* Directorio de Contactos en Tiempo Real */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Directorio de Pacientes</h3>
              <p className="text-xs text-slate-500">
                {loadingDirectory && patients.length === 0
                  ? 'Cargando contactos...'
                  : `Mostrando ${filteredPatients.length} de ${patients.length} pacientes`}
              </p>
            </div>
            <button
              onClick={fetchPatients}
              disabled={loadingDirectory}
              className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <svg className={`w-3.5 h-3.5 ${loadingDirectory ? 'animate-spin text-blue-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loadingDirectory ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            {/* Buscador de Contactos */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                aria-label="Buscar por nombre o teléfono"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition"
              />
            </div>

            {/* Filtro por estado pre-operatorio */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 self-start" role="group" aria-label="Filtrar por estado de exámenes">
              {filtros.map((filtro) => (
                <button
                  key={filtro.id}
                  type="button"
                  onClick={() => setFiltroEstado(filtro.id)}
                  aria-pressed={filtroEstado === filtro.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    filtroEstado === filtro.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filtro.label}
                  <span
                    className={`px-1.5 rounded-md text-[10px] ${
                      filtroEstado === filtro.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    {filtro.total}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {directoryError && (
            <div className="p-3 rounded-xl text-xs bg-amber-50 text-amber-800 border border-amber-200">
              {directoryError}
            </div>
          )}
        </div>

        {/* Encabezados de columnas (escritorio) */}
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_5.5rem] gap-4 px-6 py-2.5 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Paciente</span>
          <span>Contacto</span>
          <span>Estado pre-operatorio</span>
          <span className="text-right">Acción</span>
        </div>

        {/* Lista de Pacientes */}
        <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100">
          {loadingDirectory && patients.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-3 animate-pulse" aria-hidden="true">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-slate-100" />
                  <div className="h-2.5 w-24 rounded bg-slate-100" />
                </div>
              </div>
            ))
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-14 px-6">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm mt-3">
                {hayFiltrosActivos
                  ? 'No se encontraron pacientes que coincidan con la búsqueda.'
                  : 'Aún no hay pacientes en el directorio. Registra el primero con el botón "Nuevo paciente".'}
              </p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="px-5 sm:px-6 py-3.5 hover:bg-slate-50/70 transition flex flex-wrap items-center gap-x-4 gap-y-2 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_5.5rem]"
              >
                {/* Paciente */}
                <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${tonoAvatar(patient.nombre)}`}
                    aria-hidden="true"
                  >
                    {iniciales(patient.nombre)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{patient.nombre}</p>
                    <span className="text-xs text-slate-500">{patient.edad} años</span>
                  </div>
                </div>

                {/* Contacto */}
                <div className="flex items-center gap-1.5 text-sm text-slate-600 min-w-0 order-last w-full pl-[3.25rem] md:order-none md:w-auto md:pl-0">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate tabular-nums">{patient.telefono}</span>
                </div>

                {/* Estado pre-operatorio */}
                <div>
                  {patient.examenes_sangre_validados ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Luz Verde
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Exámenes Pendientes
                    </span>
                  )}
                </div>

                {/* Acción */}
                <div className="md:text-right">
                  {onSelectForValidation && (
                    <button
                      onClick={() => onSelectForValidation(patient.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-100 rounded-lg transition"
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
      </section>
    </div>
  );
};
