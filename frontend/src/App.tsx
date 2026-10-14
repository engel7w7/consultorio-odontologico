import { useState } from 'react';
import { PatientRegistrationForm } from './components/PatientRegistrationForm';
import { BloodExamCheck } from './components/BloodExamCheck';
import { DailyAgenda } from './components/DailyAgenda';
import { MedicalHistory } from './components/MedicalHistory';

function App() {
  const [examStatus, setExamStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'registro' | 'antecedentes' | 'validacion'>('agenda');

  const [currentDateStr] = useState<string>(() => {
    const now = new Date();
    const weekday = new Intl.DateTimeFormat('es-BO', { weekday: 'long' }).format(now);
    const day = now.getDate();
    const month = new Intl.DateTimeFormat('es-BO', { month: 'long' }).format(now);
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capWeekday} ${day} de ${month}`;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Consultorio Odontológico
            </h1>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium">
            {currentDateStr}
          </div>
        </header>

        {/* Navegación según el flujo clínico del odontólogo */}
        <nav aria-label="Navegación principal" className="border-b border-slate-200">
          <div className="flex space-x-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className={`pb-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'agenda'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('registro')}
              className={`pb-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'registro'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Pacientes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('antecedentes')}
              className={`pb-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'antecedentes'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Antecedentes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('validacion')}
              className={`pb-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'validacion'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Exámenes
            </button>
          </div>
        </nav>

        <main className="space-y-6">
          {activeTab === 'agenda' ? (
            <DailyAgenda />
          ) : activeTab === 'registro' ? (
            <PatientRegistrationForm />
          ) : activeTab === 'antecedentes' ? (
            <MedicalHistory />
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Expediente clínico del paciente
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-0.5">Paciente</span>
                  <span className="font-medium text-slate-900">Juan Pérez</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-0.5">Edad</span>
                  <span className="font-medium text-slate-900">34 años</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-0.5">Procedimiento</span>
                  <span className="font-medium text-slate-900">Extracción de tercer molar</span>
                </div>
              </div>

              <div className="pt-1">
                <BloodExamCheck
                  patientId="sample-patient-id"
                  initialStatus={examStatus}
                  onStatusChange={setExamStatus}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
