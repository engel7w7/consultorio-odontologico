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
  `w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
    hasError
      ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
  }`;

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

  const filteredPatients = patients.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.telefono.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      {/* Encabezado de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pacientes</h2>
          <p className="text-sm text-slate-500">Directorio activo del consultorio</p>
        </div>
        <button
          type="button"
          onClick={abrirModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg shadow-xs hover:shadow transition flex items-center justify-center space-x-1.5 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo paciente</span>
        </button>
      </div>

      {/* Resumen de Métricas del Directorio (Sin emojis, usando iconos SVG) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total de Pacientes</p>
            <p className="text-xl font-bold text-slate-800">{patients.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Con Luz Verde Médica</p>
            <p className="text-xl font-bold text-slate-800">
              {patients.filter((p) => p.examenes_sangre_validados).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Exámenes Pendientes</p>
            <p className="text-xl font-bold text-slate-800">
              {patients.filter((p) => !p.examenes_sangre_validados).length}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de Registro en modal */}
      <Modal
        isOpen={isModalOpen}
        title="Registrar Nuevo Paciente"
        description="Ingresa los datos del paciente para incorporarlo al directorio activo del consultorio."
        onClose={cerrarModal}
      >
        {errorEnvio && (
          <div
            role="alert"
            className="p-3.5 rounded-lg text-sm border flex items-start space-x-2.5 transition-all bg-rose-50 border-rose-200 text-rose-800"
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
            <label htmlFor="paciente-nombre" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
              <p id="paciente-nombre-error" className="mt-1 text-xs text-rose-600">
                {errorVisible('nombre')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="paciente-telefono" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
              aria-describedby={errorVisible('telefono') ? 'paciente-telefono-error' : undefined}
              className={inputClassName(Boolean(errorVisible('telefono')))}
              placeholder="Ej: 77712345"
            />
            {errorVisible('telefono') && (
              <p id="paciente-telefono-error" className="mt-1 text-xs text-rose-600">
                {errorVisible('telefono')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="paciente-edad" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
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
              <p id="paciente-edad-error" className="mt-1 text-xs text-rose-600">
                {errorVisible('edad')}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={isSubmitting}
              className="sm:flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-xs hover:shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Guardando...' : 'Guardar en Directorio'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onDismiss={ocultarToast} />

      {/* Directorio de Contactos en Tiempo Real */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Directorio de Pacientes</h3>
            <p className="text-xs text-slate-500">Contactos disponibles para consulta y atención clínica</p>
          </div>
          <button
            onClick={fetchPatients}
            disabled={loadingDirectory}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <svg className={`w-3.5 h-3.5 ${loadingDirectory ? 'animate-spin text-blue-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loadingDirectory ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>

        {/* Buscador de Contactos con SVG */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                  : 'Aún no hay pacientes en el directorio. Registra el primero con el botón "Nuevo paciente".'}
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
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{patient.telefono}</span>
                      </span>
                      <span>•</span>
                      <span>{patient.edad} años</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {patient.examenes_sangre_validados ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                      Luz Verde
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1"></span>
                      Exámenes Pendientes
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
  );
};
