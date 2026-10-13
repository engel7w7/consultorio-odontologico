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
      const response = await fetch('http://localhost:3000/api/patients', {
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
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Registro de Paciente (HU-02)</h3>

      {mensaje && (
        <div
          className={`p-3 mb-4 rounded text-sm ${
            mensaje.tipo === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Ana María Quispe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono de Contacto</label>
          <input
            type="text"
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 71234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Edad</label>
          <input
            type="number"
            required
            min="1"
            max="120"
            value={edad}
            onChange={(e) => setEdad(Number(e.target.value))}
            className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 28"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
        >
          Guardar en Directorio
        </button>
      </form>
    </div>
  );
};
