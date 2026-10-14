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
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">Validación médica de exámenes</h4>
        <p className="text-xs text-slate-500 mt-0.5">Requisito obligatorio para procedimientos de extracción</p>
      </div>

      <div className="flex items-center gap-3">
        {isValidated ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            Luz verde médica
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Exámenes pendientes
          </span>
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            isValidated
              ? 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {loading ? 'Guardando...' : isValidated ? 'Revocar validación' : 'Validar exámenes'}
        </button>
      </div>
    </div>
  );
};
