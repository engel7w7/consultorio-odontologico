import React, { useEffect } from 'react';
import type { TabType } from '../types/navigation';
import type { AuthUser } from '../types/auth';

export interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: AuthUser;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'registro',
    label: 'Directorio de Pacientes',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: 'busqueda',
    label: 'Buscador de Pacientes',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    id: 'validacion',
    label: 'Validación de Exámenes',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    id: 'agenda',
    label: 'Agenda Diaria',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: 'antecedentes',
    label: 'Antecedentes Médicos',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: 'historial',
    label: 'Historial Clínico',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'retorno',
    label: 'Retorno de Pacientes',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Manejo de la tecla Escape para cerrar el drawer en móviles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };

    if (isMobileOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, onCloseMobile]);

  const handleSelectTab = (tab: TabType) => {
    onTabChange(tab);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop oscuro para pantallas móviles (< 768px) */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Barra lateral vertical */}
      <aside
        id="sidebar-navigation"
        aria-label="Barra lateral de navegación"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xs ${
          isMobileOpen
            ? 'translate-x-0 w-72'
            : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Cabecera del Sidebar: Logo y título */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            <div
              className={`flex items-center gap-3 overflow-hidden ${
                isCollapsed ? 'md:justify-center md:w-full' : ''
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs"
                aria-hidden="true"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>

              {/* Nombre visible solo cuando está expandido o en móvil */}
              <div
                className={`flex flex-col transition-opacity duration-200 ${
                  isCollapsed ? 'md:hidden' : 'block'
                }`}
              >
                <span className="text-sm font-bold text-slate-900 leading-tight truncate">
                  Centro Odontológico
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  Gestión Clínica
                </span>
              </div>
            </div>

            {/* Botón de cerrar para versión móvil */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Cerrar menú de navegación"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menú de navegación principal */}
          <nav
            aria-label="Navegación principal"
            className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-14rem)]"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isCollapsed ? 'md:justify-center md:px-0' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span
                    className={`truncate transition-opacity duration-200 ${
                      isCollapsed ? 'md:sr-only' : 'inline'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie del Sidebar: Botón Colapsar + Perfil del Odontólogo y Salir */}
        <div className="border-t border-slate-100 p-3 space-y-3 bg-slate-50/60">
          {/* Botón de expandir / contraer en escritorio */}
          <div className="hidden md:flex justify-end">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
            >
              {isCollapsed ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  <span className="truncate">Contraer menú</span>
                </>
              )}
            </button>
          </div>

          {/* Tarjeta de información del usuario autenticado */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs ${
              isCollapsed ? 'md:justify-center md:p-1.5' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-200 text-xs"
                title={`${currentUser.nombre} - ${currentUser.especialidad}`}
              >
                Dr
              </div>
              <div className={`min-w-0 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                <div className="font-bold text-xs text-slate-800 truncate" title={currentUser.nombre}>
                  {currentUser.nombre}
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={currentUser.especialidad}>
                  {currentUser.especialidad}
                </div>
              </div>
            </div>

            {/* Botón Salir visible en modo expandido */}
            <div className={isCollapsed ? 'md:hidden' : 'block'}>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                title="Cerrar sesión médica"
                aria-label="Cerrar sesión"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* Botón Salir compacto en modo colapsado */}
          {isCollapsed && (
            <div className="hidden md:flex justify-center">
              <button
                type="button"
                onClick={onLogout}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition focus:outline-none focus:ring-2 focus:ring-rose-500"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="sr-only">Salir</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
