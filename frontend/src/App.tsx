import { useState } from 'react';
import { BloodExamCheck } from './components/BloodExamCheck';

function App() {
  const [examStatus, setExamStatus] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Sistema de Gestión Odontológico
          </h1>
          <p className="text-sm text-slate-500">
            Módulo de Validación Pre-Operatoria y Control de Pacientes
          </p>
        </header>

        <main className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Expediente Clínico del Paciente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Paciente</span>
                <span className="font-medium text-slate-800">Juan Pérez</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Edad</span>
                <span className="font-medium text-slate-800">34 años</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 block">Procedimiento</span>
                <span className="font-medium text-slate-800">Extracción de Tercer Molar</span>
              </div>
            </div>

            <div className="pt-2">
              <BloodExamCheck
                patientId="sample-patient-id"
                initialStatus={examStatus}
                onStatusChange={setExamStatus}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
