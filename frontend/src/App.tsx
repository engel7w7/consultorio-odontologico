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
      {/* Barra de Navegación Principal de la Clínica */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Centro Odontológico Especializado
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestión Clínica, Directorio y Control Pre-Quirúrgico
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Servidor Conectado
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">Consultorio Dental</span>
          </div>
        </div>

        {/* Módulos Clínicos */}
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2">
              <button
                onClick={() => setActiveTab('registro')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'registro'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Directorio de Pacientes</span>
              </button>

              <button
                onClick={() => setActiveTab('validacion')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'validacion'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Validación de Exámenes</span>
              </button>

              <button
                onClick={() => setActiveTab('agenda')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'agenda'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Agenda Diaria</span>
              </button>

              <button
                onClick={() => setActiveTab('antecedentes')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                  activeTab === 'antecedentes'
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Antecedentes Médicos</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Área de Contenido Principal */}
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
