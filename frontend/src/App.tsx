import { useState, useEffect } from 'react';
import { PatientRegistrationForm } from './components/PatientRegistrationForm';
import { BloodExamCheck } from './components/BloodExamCheck';
import { DailyAgenda } from './components/DailyAgenda';
import { MedicalHistory } from './components/MedicalHistory';
import { DoctorLogin } from './components/DoctorLogin';
import type { AuthUser } from './types/auth';

type TabType = 'registro' | 'validacion' | 'agenda' | 'antecedentes';

if (typeof window !== 'undefined' && !(window as any).__fetchAuthIntercepted) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    const token = localStorage.getItem('dental_auth_token');
    const isApiRequest =
      (typeof input === 'string' && input.includes('/api/')) ||
      (input instanceof URL && input.pathname.includes('/api/'));

    if (token && isApiRequest) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
  (window as any).__fetchAuthIntercepted = true;
}

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('dental_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>('registro');
  const [selectedPatientForValidation, setSelectedPatientForValidation] = useState<string>('sample-patient-id');

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dental_auth_user');
    localStorage.removeItem('dental_auth_token');
  };

  useEffect(() => {
    const token = localStorage.getItem('dental_auth_token');
    if (token) {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            handleLogout();
          }
        })
        .catch(() => {
          // Servidor no disponible, se preserva sesión local
        });
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('dental_auth_user', JSON.stringify(user));
    localStorage.setItem('dental_auth_token', token);
  };

  const handleSelectForValidation = (patientId: string) => {
    setSelectedPatientForValidation(patientId);
    setActiveTab('validacion');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <header className="bg-white border-b border-slate-200 py-3.5 px-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Centro Odontológico Especializado
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Control Clínico y Seguridad del Paciente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200 font-medium">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Acceso Protegido</span>
            </span>
          </div>
        </header>

        <main className="flex-1">
          <DoctorLogin onLoginSuccess={handleLoginSuccess} />
        </main>

        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          Sistema de Gestión Odontológica &copy; 2026 · Acceso Restringido a Profesionales de la Salud
        </footer>
      </div>
    );
  }

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

          {/* Perfil del Odontólogo Autenticado y Salir */}
          <div className="flex items-center space-x-3 self-end sm:self-auto text-xs">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-slate-800">{currentUser.nombre}</div>
              <div className="text-[11px] text-slate-500">{currentUser.especialidad}</div>
            </div>

            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center border border-blue-200">
              Dr
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition font-medium focus:outline-none"
              title="Cerrar sesión médica"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Salir</span>
            </button>
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
          <DailyAgenda onSelectPatientForValidation={handleSelectForValidation} />
        ) : (
          <MedicalHistory />
        )}
      </main>
    </div>
  );
}

export default App;
