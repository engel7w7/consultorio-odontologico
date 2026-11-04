import React, { useState, useEffect, useCallback } from 'react';
import type { ProfilaxisVencidaItem, RetornoMensualResponse } from '../types/recall';
import {
  buildWhatsAppReminderUrl,
  buildWhatsAppRecallInviteUrl,
} from '../utils/whatsapp.utils';

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

function formatShortDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getShiftedMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + delta;
  const newY = Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  return `${newY}-${String(newM).padStart(2, '0')}`;
}

function formatMonthName(yearMonth: string): string {
  try {
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 15);
    const name = new Intl.DateTimeFormat('es-BO', { month: 'long', year: 'numeric' }).format(d);
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return yearMonth;
  }
}

export const PatientRecall: React.FC = () => {
  // Estado HU-14 (Profilaxis vencidas generales)
  const [items, setItems] = useState<ProfilaxisVencidaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado HU-15 (Lista mensual de retorno con priorización)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentYearMonth());
  const [monthlyData, setMonthlyData] = useState<RetornoMensualResponse | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(true);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  // Estado del modal de agendamiento compartido
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; nombre: string } | null>(null);
  const [fechaCita, setFechaCita] = useState<string>('');
  const [horaCita, setHoraCita] = useState<string>('09:00');
  const [savingAppointment, setSavingAppointment] = useState<boolean>(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);

  const fetchVencidas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const token = localStorage.getItem('dental_auth_token');
      const res = await fetch(`${apiUrl}/api/recall/profilaxis-vencidas`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener la lista de profilaxis vencidas');
      }

      const data: ProfilaxisVencidaItem[] = await res.json();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar profilaxis vencidas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMensual = useCallback(async (mesStr: string) => {
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const token = localStorage.getItem('dental_auth_token');
      const res = await fetch(`${apiUrl}/api/recall/retorno-mensual?mes=${encodeURIComponent(mesStr)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener la lista mensual de retorno');
      }

      const data: RetornoMensualResponse = await res.json();
      setMonthlyData(data);
    } catch (err: unknown) {
      setMonthlyError(err instanceof Error ? err.message : 'Error al consultar la lista mensual');
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  // Carga inicial sin setState síncrono durante render
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const token = localStorage.getItem('dental_auth_token');
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const [resVencidas, resMensual] = await Promise.all([
          fetch(`${apiUrl}/api/recall/profilaxis-vencidas`, { headers: authHeader }),
          fetch(`${apiUrl}/api/recall/retorno-mensual?mes=${selectedMonth}`, { headers: authHeader }),
        ]);

        if (resVencidas.ok) {
          const dataVencidas: ProfilaxisVencidaItem[] = await resVencidas.json();
          if (isMounted) setItems(dataVencidas);
        } else {
          if (isMounted) setError('Error al cargar profilaxis vencidas');
        }

        if (resMensual.ok) {
          const dataMensual: RetornoMensualResponse = await resMensual.json();
          if (isMounted) setMonthlyData(dataMensual);
        } else {
          if (isMounted) setMonthlyError('Error al cargar la lista mensual de retorno');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error de conexión');
          setMonthlyError(err instanceof Error ? err.message : 'Error de conexión');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setMonthlyLoading(false);
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth]);

  const handleMonthChange = (delta: number) => {
    const nextMonth = getShiftedMonth(selectedMonth, delta);
    setSelectedMonth(nextMonth);
  };

  const handleOpenAgendar = (patient: { id: string; nombre: string }) => {
    setSelectedPatient(patient);
    setAppointmentError(null);
    setFechaCita(getTomorrowDateString());
    setHoraCita('09:00');
    setModalOpen(true);
  };

  const handleConfirmAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !fechaCita || !horaCita) return;

    setSavingAppointment(true);
    setAppointmentError(null);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const token = localStorage.getItem('dental_auth_token');

      const fechaInicioStr = `${fechaCita}T${horaCita}:00-04:00`;
      const fechaInicioDate = new Date(fechaInicioStr);
      const fechaFinDate = new Date(fechaInicioDate.getTime() + 30 * 60000);

      const res = await fetch(`${apiUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          motivo: 'Profilaxis y destartraje dental',
          fecha_inicio: fechaInicioDate.toISOString(),
          fecha_fin: fechaFinDate.toISOString(),
          duracion_minutos: 30,
          tipo_tratamiento: 'PROFILAXIS',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Error al agendar la profilaxis');
      }

      setModalOpen(false);
      setSelectedPatient(null);
      // Actualizar ambas secciones: el paciente pasa a estar reagendado
      await Promise.all([fetchVencidas(), fetchMensual(selectedMonth)]);
    } catch (err: unknown) {
      setAppointmentError(err instanceof Error ? err.message : 'Error inesperado al agendar');
    } finally {
      setSavingAppointment(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabecera del Módulo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Retorno y Re-agendamiento de Pacientes
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Detección y priorización mensual de pacientes para mantenimiento preventivo y optimización de ingresos clínicos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void fetchVencidas();
              void fetchMensual(selectedMonth);
            }}
            disabled={loading || monthlyLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            Actualizar todo
          </button>
        </div>
      </div>

      {/* SECCIÓN 1 (HU-15): Lista de retorno del mes con priorización */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Lista de retorno del mes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pacientes sugeridos para contacto clasificados por prioridad clínica y financiera.
            </p>
          </div>

          {/* Selector de Mes */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Mes anterior"
            >
              Mes anterior
            </button>
            <span className="text-xs font-bold text-slate-800 px-3 py-1.5 bg-slate-100 rounded-lg min-w-36 text-center">
              {formatMonthName(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Mes siguiente"
            >
              Mes siguiente
            </button>
          </div>
        </div>

        {/* Resumen del Mes */}
        {monthlyData && !monthlyLoading && !monthlyError && (
          <div className="flex flex-wrap items-center gap-4 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium">
            <span>
              <strong>{monthlyData.total}</strong> {monthlyData.total === 1 ? 'paciente sugerido' : 'pacientes sugeridos'}
            </span>
            <span className="text-blue-300">·</span>
            <span>
              Ingreso estimado:{' '}
              <strong className="text-blue-700">
                Bs {monthlyData.ingreso_estimado_total.toFixed(2)}
              </strong>
            </span>
          </div>
        )}

        {monthlyLoading && (
          <div className="py-10 text-center text-slate-500 text-sm">
            Cargando lista de retorno mensual…
          </div>
        )}

        {monthlyError && !monthlyLoading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {monthlyError}
          </div>
        )}

        {!monthlyLoading && !monthlyError && monthlyData && monthlyData.pacientes.length === 0 && (
          <div className="py-10 text-center text-slate-500 text-sm">
            No hay pacientes sugeridos para este mes
          </div>
        )}

        {!monthlyLoading && !monthlyError && monthlyData && monthlyData.pacientes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-32">Prioridad</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Motivos</th>
                  <th className="py-3 px-4 text-right">Ingreso Estimado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.pacientes.map((item) => {
                  const whatsappUrl = buildWhatsAppRecallInviteUrl(
                    item.patient.telefono,
                    item.patient.nombre
                  );

                  return (
                    <tr key={item.patient.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden w-16">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.prioridad >= 70
                                  ? 'bg-rose-500'
                                  : item.prioridad >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${item.prioridad}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 text-[11px] w-7 text-right">
                            {item.prioridad}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.patient.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.patient.telefono || 'Sin teléfono'}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.estado === 'VENCE_ESTE_MES' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Vence este mes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Atrasado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.motivos.map((motivo, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {motivo}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        Bs {item.ingreso_estimado.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                              title="Invitar por WhatsApp a control preventivo"
                            >
                              WhatsApp
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenAgendar(item.patient)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                          >
                            Agendar profilaxis
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN 2 (HU-14): Profilaxis vencida general */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-800">
            Profilaxis vencida (6+ meses)
          </h3>
          <p className="text-xs text-slate-500">
            Pacientes cuya última profilaxis o limpieza atendida fue realizada hace 6 meses o más.
          </p>
        </div>

        {loading && (
          <div className="py-12 text-center text-slate-500 text-sm">
            Cargando pacientes con profilaxis vencida…
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">
            No hay profilaxis vencidas
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Última profilaxis</th>
                  <th className="py-3 px-4">Venció el</th>
                  <th className="py-3 px-4">Días de atraso</th>
                  <th className="py-3 px-4 text-right">Estado / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const whatsappUrl = item.proxima_cita
                    ? buildWhatsAppReminderUrl(
                        item.patient.telefono,
                        item.patient.nombre,
                        item.proxima_cita,
                        'Profilaxis y destartraje dental'
                      )
                    : null;

                  return (
                    <tr key={item.patient.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.patient.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.patient.telefono || 'Sin teléfono'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(item.ultima_profilaxis)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(item.fecha_vencimiento)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {item.dias_atraso} {item.dias_atraso === 1 ? 'día' : 'días'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.reagendado ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ya reagendado: {item.proxima_cita ? formatShortDate(item.proxima_cita) : 'confirmado'}
                            </span>
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                                title="Enviar recordatorio de profilaxis por WhatsApp"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAgendar(item.patient)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                          >
                            Agendar profilaxis
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal propio de Agendamiento de Profilaxis */}
      {modalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white">
              <h3 className="text-base font-bold">Agendar Profilaxis Preventiva</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Re-agendamiento automático para {selectedPatient.nombre}
              </p>
            </div>

            <form onSubmit={handleConfirmAgendar} className="p-6 space-y-4">
              {appointmentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  {appointmentError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Paciente
                </label>
                <input
                  type="text"
                  value={selectedPatient.nombre}
                  disabled
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Motivo de la Cita
                </label>
                <input
                  type="text"
                  value="Profilaxis y destartraje dental"
                  disabled
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Duración
                  </label>
                  <input
                    type="text"
                    value="30 minutos"
                    disabled
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={horaCita}
                    onChange={(e) => setHoraCita(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de la Cita
                </label>
                <input
                  type="date"
                  value={fechaCita}
                  onChange={(e) => setFechaCita(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={savingAppointment}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAppointment}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {savingAppointment ? 'Guardando…' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
