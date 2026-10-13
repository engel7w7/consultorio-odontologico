import React, { useState } from 'react';

interface BloodExamCheckProps {
  patientId: string;
  initialStatus: boolean;
  onStatusChange?: (newStatus: boolean) => void;
}

export const BloodExamCheck: React.FC<BloodExamCheckProps> = ({
  patientId,
  initialStatus,
  onStatusChange,
}) => {
  const [isValidated, setIsValidated] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients/${patientId}/blood-exams`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examenes_sangre_validados: !isValidated }),
      });

      if (!res.ok) throw new Error('Error al actualizar');
      const data = await res.json();
      setIsValidated(data.examenes_sangre_validados);
      if (onStatusChange) onStatusChange(data.examenes_sangre_validados);
    } catch {
      alert('Error al actualizar el estado de exámenes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">
      <div>
        <h4 className="text-sm font-bold text-gray-700">Validación Médica de Exámenes (HU-07)</h4>
        <p className="text-xs text-gray-500">Requisito obligatorio para procedimientos de extracción</p>
      </div>

      <div className="flex items-center space-x-3">
        {isValidated ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
            ● Luz Verde Médica
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            ○ Exámenes Pendientes
          </span>
        )}

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-3 py-1.5 text-xs font-medium rounded transition text-white ${
            isValidated ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Guardando...' : isValidated ? 'Revocar Validación' : 'Validar Exámenes'}
        </button>
      </div>
    </div>
  );
};
