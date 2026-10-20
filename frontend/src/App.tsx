import { useState } from 'react';
import { PatientRegistrationForm } from './components/PatientRegistrationForm';
import { BloodExamCheck } from './components/BloodExamCheck';
import { DailyAgenda } from './components/DailyAgenda';
import { MedicalHistory } from './components/MedicalHistory';
import { PatientSearch } from './components/PatientSearch';

function App() {
  const [examStatus, setExamStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'registro' | 'busqueda' | 'validacion' | 'agenda' | 'antecedentes'
  >('registro');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Sistema de Gestión Odontológico
          </h1>
          <p className="text-sm text-slate-500">
            Directorio de Pacientes y Control Pre-Operatorio
          </p>
        </header>

        {/* Navegación de Historias de Usuario */}
        <div className="flex border-b border-slate-200 space-x-4">
          <button
            onClick={() => setActiveTab('registro')}
            className={`pb-2 px-1 text-sm font-semibold transition border-b-2 ${
              activeTab === 'registro'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            HU-02: Registro de Paciente
          </button>
          <button
            onClick={() => setActiveTab('busqueda')}
            className={`pb-2 px-1 text-sm font-semibold transition border-b-2 ${
              activeTab === 'busqueda'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            HU-12: Buscador de Pacientes
          </button>
          <button
            onClick={() => setActiveTab('validacion')}
            className={`pb-2 px-1 text-sm font-semibold transition border-b-2 ${
              activeTab === 'validacion'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            HU-07: Validación de Exámenes
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`pb-2 px-1 text-sm font-semibold transition border-b-2 ${
              activeTab === 'agenda'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            HU-04: Agenda Diaria
          </button>
          <button
            onClick={() => setActiveTab('antecedentes')}
            className={`pb-2 px-1 text-sm font-semibold transition border-b-2 ${
              activeTab === 'antecedentes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            HU-03: Antecedentes Médicos
          </button>
        </div>

        <main className="space-y-6">
          {activeTab === 'registro' ? (
            <div>
              <PatientRegistrationForm />
            </div>
          ) : activeTab === 'busqueda' ? (
            <PatientSearch />
          ) : activeTab === 'validacion' ? (
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
          ) : activeTab === 'agenda' ? (
            <DailyAgenda />
          ) : (
            <MedicalHistory />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
