import React, { useState } from 'react';

export const PatientRegistrationForm: React.FC<{ onPatientAdded?: () => void }> = ({
  onPatientAdded,
}) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [edad, setEdad] = useState<number | ''>('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, edad: Number(edad) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar paciente');
      }

      setMensaje({ tipo: 'ok', texto: 'Paciente registrado exitosamente en el sistema' });
      setNombre('');
      setTelefono('');
      setEdad('');
      if (onPatientAdded) onPatientAdded();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado';
      setMensaje({ tipo: 'error', texto: errorMsg });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Registro de paciente
        </h2>
      </div>

      {mensaje && (
        <div
          className={`p-3 text-sm rounded-r-md border-l-4 ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
              : 'bg-rose-50 border-rose-500 text-rose-800'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Ej: Ana María Quispe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Teléfono de contacto
            </label>
            <input
              type="text"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Ej: 71234567"
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Edad
          </label>
          <input
            type="number"
            required
            min="1"
            max="120"
            value={edad}
            onChange={(e) => setEdad(Number(e.target.value))}
            className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Ej: 28"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Guardar paciente
          </button>
        </div>
      </form>
    </div>
  );
};
