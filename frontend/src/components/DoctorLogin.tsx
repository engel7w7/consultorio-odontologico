import React, { useState } from 'react';
import type { AuthResponse, AuthUser } from '../types/auth';

interface DoctorLoginProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

const inputClassName =
  'w-full pl-10 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition';

export const DoctorLogin: React.FC<DoctorLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión médica');
      }

      const authData: AuthResponse = data;
      onLoginSuccess(authData.user, authData.token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado de autenticación';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const detectarBloqMayus = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLockOn(e.getModifierState('CapsLock'));

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Panel de marca (escritorio) */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white p-12">
        <svg
          className="absolute -right-24 -bottom-24 w-[28rem] h-[28rem] text-white/[0.07] rotate-12 pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M7 3C4.5 3 3 5 3 7.5c0 2 .7 3.3 1.3 5 .6 1.8.7 4 1.2 6.2.3 1.4.9 2.3 1.8 2.3 1.1 0 1.4-1.3 1.7-3 .3-1.6.6-3 2-3s1.7 1.4 2 3c.3 1.7.6 3 1.7 3 .9 0 1.5-.9 1.8-2.3.5-2.2.6-4.4 1.2-6.2.6-1.7 1.3-3 1.3-5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z" />
        </svg>

        <div className="relative flex items-center gap-3">
          <img src="/logo.svg" alt="" className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/20 p-0.5" />
          <div>
            <p className="font-display font-bold leading-tight">Centro Odontológico Especializado</p>
            <p className="text-xs text-blue-100">Control Clínico y Seguridad del Paciente</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Atención clínica segura, en un solo lugar.
          </h2>
        </div>

        <p className="relative text-xs text-blue-100/80">
          Sistema de Gestión Odontológica &copy; 2026
        </p>
      </aside>

      {/* Panel del formulario */}
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Marca compacta (móvil y tablet) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.svg" alt="" className="w-10 h-10 rounded-xl bg-blue-600 p-0.5 shadow-sm shadow-blue-600/30" />
            <div>
              <p className="font-display font-bold text-slate-900 leading-tight">Centro Odontológico</p>
              <p className="text-xs text-slate-500">Control Clínico y Seguridad del Paciente</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Acceso Protegido
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-4">
            Portal Odontológico Seguro
          </h1>
          

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-2.5"
              >
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="font-medium">{errorMessage}</div>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Correo Electrónico Profesional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinica.com"
                  required
                  className={`${inputClassName} pr-3`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Contraseña de Acceso Médico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={detectarBloqMayus}
                  onKeyDown={detectarBloqMayus}
                  onBlur={() => setCapsLockOn(false)}
                  placeholder="••••••••"
                  required
                  className={`${inputClassName} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {capsLockOn && (
                <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                  Bloq Mayús está activado
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Verificando credenciales…</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema Clínico</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Pie de seguridad clínica */}
          <p className="mt-10 pt-5 border-t border-slate-200 text-[11px] text-slate-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Acceso Restringido a Profesionales de la Salud · Sesión protegida</span>
          </p>
        </div>
      </main>
    </div>
  );
};
