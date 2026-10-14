import { useState } from 'react';
import { PatientRegistrationForm } from './components/PatientRegistrationForm';
import { BloodExamCheck } from './components/BloodExamCheck';
import { DailyAgenda } from './components/DailyAgenda';
import { MedicalHistory } from './components/MedicalHistory';

type TabType = 'registro' | 'validacion' | 'agenda' | 'antecedentes';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('registro');
  const [selectedPatientForValidation, setSelectedPatientForValidation] = useState<string>('sample-patient-id');

  const handleSelectForValidation = (patientId: string) => {
    setSelectedPatientForValidation(patientId);
    setActiveTab('validacion');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Barra Superior de la Clínica */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-xs">
              🦷
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Clínica Dental OdontoSalud
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistema Integral de Gestión Clínica & Control Quirúrgico
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              En Línea
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-medium">Dr. Odontólogo Titular</span>
          </div>
        </div>

        {/* Navegación Modular por Especialidad */}
        <div className="border-t border-slate-100 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2">
              <button
                onClick={() => setActiveTab('registro')}
                title="HU-02: Registro de Paciente"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'registro'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>👥</span>
                <span>Directorio de Pacientes</span>
                <span className="sr-only">HU-02: Registro de Paciente</span>
              </button>

              <button
                onClick={() => setActiveTab('validacion')}
                title="HU-07: Validación de Exámenes"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'validacion'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>🩺</span>
                <span>Validación de Exámenes</span>
                <span className="sr-only">HU-07: Validación de Exámenes</span>
              </button>

              <button
                onClick={() => setActiveTab('agenda')}
                title="HU-04: Agenda Diaria"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'agenda'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>📅</span>
                <span>Agenda Diaria</span>
                <span className="sr-only">HU-04: Agenda Diaria</span>
              </button>

              <button
                onClick={() => setActiveTab('antecedentes')}
                title="HU-03: Antecedentes Médicos"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'antecedentes'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>📋</span>
                <span>Antecedentes Médicos</span>
                <span className="sr-only">HU-03: Antecedentes Médicos</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'registro' ? (
          <PatientRegistrationForm onSelectForValidation={handleSelectForValidation} />
        ) : activeTab === 'validacion' ? (
          <BloodExamCheck patientId={selectedPatientForValidation} />
        ) : activeTab === 'agenda' ? (
          <DailyAgenda />
        ) : (
          <MedicalHistory />
        )}
      </main>
    </div>
  );
}

export default App;
