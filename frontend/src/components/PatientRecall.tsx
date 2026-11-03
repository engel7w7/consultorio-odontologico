import React, { useState, useEffect, useCallback } from 'react';
import type { ProfilaxisVencidaItem } from '../types/recall';
import { buildWhatsAppReminderUrl } from '../utils/whatsapp.utils';

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

export const PatientRecall: React.FC = () => {
  const [items, setItems] = useState<ProfilaxisVencidaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de agendamiento
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

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
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
        if (isMounted) {
          setItems(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al consultar profilaxis vencidas');
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

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
      await fetchVencidas();
    } catch (err: unknown) {
      setAppointmentError(err instanceof Error ? err.message : 'Error inesperado al agendar');
    } finally {
      setSavingAppointment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Retorno y Re-agendamiento de Pacientes
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Detección automática de pacientes con mantenimiento preventivo pendiente según protocolo clínico semestral.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchVencidas}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            Actualizar lista
          </button>
        </div>
      </div>

      {/* Sección Principal */}
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
