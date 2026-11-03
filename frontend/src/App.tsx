import { useState, useEffect } from 'react';
import { PatientRegistrationForm } from './components/PatientRegistrationForm';
import { BloodExamCheck } from './components/BloodExamCheck';
import { DailyAgenda } from './components/DailyAgenda';
import { MedicalHistory } from './components/MedicalHistory';
import { PatientSearch } from './components/PatientSearch';
import { DoctorLogin } from './components/DoctorLogin';
import { PatientHistory } from './components/PatientHistory';
import { PatientRecall } from './components/PatientRecall';
import { Sidebar } from './components/Sidebar';
import type { AuthUser } from './types/auth';
import type { TabType } from './types/navigation';

export type { TabType };

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Barra superior visible únicamente en pantallas pequeñas (< 768px) */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={isMobileNavOpen}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-bold text-sm text-slate-900 truncate">
              Centro Odontológico
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium hidden sm:inline truncate max-w-[120px]">
            {currentUser.nombre}
          </span>
          <div
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center border border-blue-200"
            title={`${currentUser.nombre} (${currentUser.especialidad})`}
          >
            Dr
          </div>
        </div>
      </header>

      {/* Componente Sidebar Vertical a la izquierda */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Área de Contenido Principal que ocupa el resto del ancho de la pantalla */}
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'registro' ? (
            <PatientRegistrationForm onSelectForValidation={handleSelectForValidation} />
          ) : activeTab === 'busqueda' ? (
            <PatientSearch />
          ) : activeTab === 'validacion' ? (
            <BloodExamCheck patientId={selectedPatientForValidation} />
          ) : activeTab === 'agenda' ? (
            <DailyAgenda onSelectPatientForValidation={handleSelectForValidation} />
          ) : activeTab === 'historial' ? (
            <PatientHistory />
          ) : activeTab === 'retorno' ? (
            <PatientRecall />
          ) : (
            <MedicalHistory />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
