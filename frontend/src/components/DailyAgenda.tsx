import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import type { DatesSetArg, EventContentArg } from '@fullcalendar/core';
import type { Appointment, EstadoCita, CreateAppointmentPayload } from '../types/appointment';
import type { Patient } from '../types/patient';
import { buildWhatsAppReminderUrl } from '../utils/whatsapp.utils';
import './DailyAgenda.css';

interface DailyAgendaProps {
  onSelectPatientForValidation?: (patientId: string) => void;
}

export const DailyAgenda: React.FC<DailyAgendaProps> = ({ onSelectPatientForValidation }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Estados del Modal de Agendar Cita (HU-08)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('09:00');
  const [horaFin, setHoraFin] = useState<string>('09:45');
  const [fechaCita, setFechaCita] = useState<string>('');
  const [submittingAppt, setSubmittingAppt] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchAppointments = useCallback(async (date: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/appointments?date=${date}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener las citas de la agenda');
      }

      const data: Appointment[] = await response.json();
      setAppointments(data);
      setLoading(false);
    } catch (err: unknown) {
      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError')
      ) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor';
      setError(msg);
      setAppointments([]);
      setLoading(false);
    }
  }, []);

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/patients`);
      if (res.ok) {
        const data: Patient[] = await res.json();
        setPatients(data);
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar pacientes para agendar:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleOpenModal = () => {
    setModalError(null);
    setModalSuccess(null);
    setFechaCita(selectedDate || todayStr);
    setIsModalOpen(true);
    loadPatients();
  };

  const handleCloseModal = () => {
    if (!submittingAppt) {
      setIsModalOpen(false);
      setModalError(null);
      setModalSuccess(null);
    }
  };

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    const year = dateInfo.start.getFullYear();
    const month = String(dateInfo.start.getMonth() + 1).padStart(2, '0');
    const day = String(dateInfo.start.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (dateStr !== selectedDate) {
      setSelectedDate(dateStr);
      fetchAppointments(dateStr);
    }
  };

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  const [todayStr] = useState<string>(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  });

  const [initialHour] = useState<number>(() => {
    const currentHour = new Date().getHours();
    return Math.max(7, Math.min(22, currentHour - 1));
  });

  const isToday = selectedDate === todayStr;

  const formattedHeaderDate = useMemo(() => {
    if (!selectedDate) return '';
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = new Intl.DateTimeFormat('es-BO', { weekday: 'long' }).format(date);
    const monthName = new Intl.DateTimeFormat('es-BO', { month: 'long' }).format(date);
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capWeekday} ${day} de ${monthName}`;
  }, [selectedDate]);

  const summaryText = useMemo(() => {
    const total = appointments.length;
    if (total === 0) return 'Sin citas';

    const atendidas = appointments.filter((a) => a.estado === 'ATENDIDA').length;
    const canceladas = appointments.filter((a) => a.estado === 'CANCELADA').length;

    const parts: string[] = [`${total} ${total === 1 ? 'cita' : 'citas'}`];
    if (atendidas > 0) {
      parts.push(`${atendidas} ${atendidas === 1 ? 'atendida' : 'atendidas'}`);
    }
    if (canceladas > 0) {
      parts.push(`${canceladas} ${canceladas === 1 ? 'cancelada' : 'canceladas'}`);
    }
    return parts.join(' · ');
  }, [appointments]);

  const scrollTime = useMemo(() => {
    if (appointments.length > 0) {
      const firstDate = new Date(appointments[0].fecha_inicio);
      const firstHour = firstDate.getHours();
      const targetHour = Math.max(7, firstHour - 1);
      return `${String(targetHour).padStart(2, '0')}:00:00`;
    }
    return `${String(initialHour).padStart(2, '0')}:00:00`;
  }, [appointments, initialHour]);

  const updateAppointmentStatus = useCallback(
    async (appointmentId: string, estado: 'ATENDIDA' | 'CANCELADA') => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const response = await fetch(`${apiUrl}/api/appointments/${appointmentId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al actualizar el estado de la cita');
        }

        const updatedAppointment: Appointment = await response.json();
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === updatedAppointment.id ? updatedAppointment : appointment
          )
        );
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al actualizar la cita');
      }
    },
    []
  );

  const events = useMemo(() => {
    return appointments.map((appt) => ({
      id: appt.id,
      title: `${appt.patient.nombre} - ${appt.motivo}`,
      start: appt.fecha_inicio,
      end: appt.fecha_fin,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: '#0f172a',
      extendedProps: {
        patientName: appt.patient.nombre,
        patientPhone: appt.patient.telefono,
        estado: appt.estado,
        motivo: appt.motivo,
        fechaInicio: appt.fecha_inicio,
      },
    }));
  }, [appointments]);

  // Detección en tiempo real de procedimiento de extracción y bloqueo de seguridad (HU-08)
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const isExtractionProcedure = useMemo(() => {
    return /extracc|exodoncia|cirug|quir[uú]rg|muela|molar/i.test(motivo);
  }, [motivo]);

  const isSafetyBlocked = useMemo(() => {
    return Boolean(
      isExtractionProcedure && selectedPatient && !selectedPatient.examenes_sangre_validados
    );
  }, [isExtractionProcedure, selectedPatient]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !motivo.trim() || !fechaCita || !horaInicio || !horaFin) {
      setModalError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (horaInicio >= horaFin) {
      setModalError('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    if (isSafetyBlocked) {
      setModalError(
        'ALERTA ROJA BLOQUEANTE: No se puede agendar una extracción sin exámenes de sangre validados.'
      );
      return;
    }

    setSubmittingAppt(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const startIso = new Date(`${fechaCita}T${horaInicio}:00-04:00`).toISOString();
      const endIso = new Date(`${fechaCita}T${horaFin}:00-04:00`).toISOString();

      const payload: CreateAppointmentPayload = {
        patient_id: selectedPatientId,
        motivo: motivo.trim(),
        fecha_inicio: startIso,
        fecha_fin: endIso,
        estado: 'PROGRAMADA',
      };

      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al agendar la cita médica');
      }

      setModalSuccess('Cita programada con éxito en la agenda');
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmittingAppt(false);
        setModalSuccess(null);
        fetchAppointments(fechaCita);
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al agendar cita';
      setModalError(msg);
      setSubmittingAppt(false);
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { patientName, patientPhone, estado, motivo, fechaInicio } = eventInfo.event.extendedProps as {
      patientName: string;
      patientPhone: string;
      estado: EstadoCita;
      motivo: string;
      fechaInicio: string;
    };

    const startDate = eventInfo.event.start;
    const endDate = eventInfo.event.end;
    const durationMinutes =
      startDate && endDate ? (endDate.getTime() - startDate.getTime()) / (1000 * 60) : 60;
    const isShort = durationMinutes < 35;

    const formatTime = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };
    const timeRange =
      startDate && endDate
        ? `${formatTime(startDate)}–${formatTime(endDate)}`
        : eventInfo.timeText;

    const statusLabel =
      estado === 'PROGRAMADA'
        ? 'Programada'
        : estado === 'ATENDIDA'
          ? 'Atendida'
          : 'Cancelada';
    const fullTooltip = `${patientName} (${timeRange}) · ${statusLabel}${motivo ? ` · ${motivo}` : ''}`;
    const whatsappUrl = buildWhatsAppReminderUrl(patientPhone || '', patientName, fechaInicio, motivo);

    let containerStyles =
      'bg-white border-l-[3px] border-l-sky-600 border-y border-r border-slate-200/90';
    let nameStyles = 'font-medium text-slate-900';
    let metaStyles = 'text-slate-500';

    if (estado === 'ATENDIDA') {
      containerStyles =
        'bg-emerald-50/70 border-l-[3px] border-l-emerald-500 border-y border-r border-emerald-100/90';
      nameStyles = 'font-medium text-slate-700';
      metaStyles = 'text-slate-500';
    } else if (estado === 'CANCELADA') {
      containerStyles =
        'bg-slate-50 border-l-[3px] border-l-slate-300 border-y border-r border-slate-200/70';
      nameStyles = 'font-medium text-slate-400 line-through';
      metaStyles = 'text-slate-400';
    }

    return (
      <div
        className={`agenda-event w-full h-full p-1.5 rounded-md overflow-hidden flex flex-col justify-center select-none text-left leading-tight ${containerStyles}`}
        title={fullTooltip}
        aria-label={fullTooltip}
      >
        {isShort ? (
          <div className="flex items-center gap-1.5 truncate">
            <span className={`text-[11px] tabular-nums font-normal ${metaStyles}`}>
              {timeRange}
            </span>
            <span className={`text-xs truncate ${nameStyles}`}>
              {patientName}
            </span>
          </div>
        ) : (
          <div className="agenda-event__content flex flex-col justify-start gap-0.5 overflow-hidden">
            {(estado === 'ATENDIDA' || whatsappUrl) && (
              <div className="flex min-w-0 items-center gap-1">
                {estado === 'ATENDIDA' && (
                  <span
                    className="agenda-event__status inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold"
                    aria-label="Cita atendida"
                  >
                    ✓ Atendida
                  </span>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-[10px] text-white hover:bg-green-700"
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Enviar recordatorio de WhatsApp a ${patientName}`}
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            )}
            <div className={`text-xs truncate ${nameStyles}`}>
              {patientName}
            </div>
            <div className={`text-[11px] tabular-nums truncate flex items-center gap-1.5 ${metaStyles}`}>
              <span className="agenda-event__time">{timeRange}</span>
              {motivo && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="truncate">{motivo}</span>
                </>
              )}
            </div>
          </div>
        )}
        {estado === 'PROGRAMADA' && (
          <div className="flex flex-wrap gap-1 mt-1">
            <button
              type="button"
              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={(event) => {
                event.stopPropagation();
                void updateAppointmentStatus(eventInfo.event.id, 'ATENDIDA');
              }}
              aria-label={`Marcar cita de ${patientName} como atendida`}
            >
              Atender
            </button>
            <button
              type="button"
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500 text-white hover:bg-slate-600"
              onClick={(event) => {
                event.stopPropagation();
                void updateAppointmentStatus(eventInfo.event.id, 'CANCELADA');
              }}
              aria-label={`Cancelar cita de ${patientName}`}
            >
              Cancelar
            </button>
          </div>
        )}
        {isShort && whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex self-start items-center gap-1 mt-1 whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white hover:bg-green-700"
            onClick={(event) => event.stopPropagation()}
            aria-label={`Enviar recordatorio de WhatsApp a ${patientName}`}
          >
            WhatsApp
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 daily-agenda">
      {/* Encabezado clínico con botón de agendar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              {formattedHeaderDate || 'Agenda Diaria'}
            </h2>
            {isToday && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Hoy
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 tabular-nums flex items-center gap-1.5">
            <span>{summaryText}</span>
            {loading && (
              <span className="text-xs text-slate-400 font-normal">· Cargando…</span>
            )}
          </p>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Agendar Cita</span>
          </button>

          <button
            type="button"
            onClick={handleToday}
            disabled={isToday}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Ir a hoy"
          >
            Hoy
          </button>
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Día anterior"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Día siguiente"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Aviso de error general de consulta */}
      {error && (
        <div className="flex items-center justify-between px-3 py-2 text-xs bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-md">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchAppointments(selectedDate)}
            className="ml-3 font-medium underline hover:text-rose-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Calendario Diario */}
      <div className="relative">
        {!loading && !error && appointments.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-slate-400 font-normal">
              Sin citas para este día
            </p>
          </div>
        )}

        <div
          className={`border border-slate-200/80 rounded-lg p-2 bg-white transition-opacity duration-150 ${
            loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
          }`}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin]}
            initialView="timeGridDay"
            headerToolbar={false}
            dayHeaders={false}
            locales={[esLocale]}
            locale="es"
            slotMinTime="07:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            allDaySlot={false}
            nowIndicator={true}
            scrollTime={scrollTime}
            events={events}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            height="auto"
          />
        </div>
      </div>

      {/* Modal HU-08: Agendar Cita con Alerta Roja Bloqueante para Extracción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  📅
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Agendar Nueva Cita</h3>
                  <p className="text-xs text-slate-500">Control de calidad y seguridad pre-quirúrgica</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submittingAppt}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              {/* Selección de Paciente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Paciente *
                </label>
                {loadingPatients ? (
                  <div className="text-xs text-slate-500 py-2">Cargando directorio de pacientes…</div>
                ) : (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.examenes_sangre_validados ? '— (🟢 Luz Verde / Exámenes Validados)' : '— (🔴 Sin Exámenes Validados)'}
                      </option>
                    ))}
                  </select>
                )}

                {/* Badge explicativo del estado del paciente */}
                {selectedPatient && (
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Estado hematológico:</span>
                    {selectedPatient.examenes_sangre_validados ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Exámenes Validados (Luz Verde)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Pendiente / Sin Exámenes
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Procedimiento o Motivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Procedimiento Odontológico / Motivo *
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Extracción de tercer molar, Limpieza dental..."
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Sugerencias rápidas para el odontólogo */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Rápidos:</span>
                  <button
                    type="button"
                    onClick={() => setMotivo('Extracción de tercer molar')}
                    className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2 py-0.5 rounded transition"
                  >
                    Extracción molar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotivo('Exodoncia simple')}
                    className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2 py-0.5 rounded transition"
                  >
                    Exodoncia
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotivo('Extracción simple de pieza')}
                    className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2 py-0.5 rounded transition"
                  >
                    Extracción simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotivo('Cirugía apical')}
                    className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-2 py-0.5 rounded transition"
                  >
                    Cirugía apical
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotivo('Limpieza profiláctica')}
                    className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 px-2 py-0.5 rounded transition"
                  >
                    Limpieza
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotivo('Restauración con resina')}
                    className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 px-2 py-0.5 rounded transition"
                  >
                    Restauración
                  </button>
                </div>
              </div>

              {/* HU-08: BANNER DE ALERTA ROJA BLOQUEANTE */}
              {isSafetyBlocked && (
                <div className="p-4 rounded-xl bg-rose-600 text-white shadow-md border-2 border-rose-700 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <h4 className="font-bold text-sm tracking-wide uppercase text-white">
                      Alerta Roja Bloqueante de Seguridad Clínica
                    </h4>
                  </div>
                  <p className="text-xs text-rose-100 leading-relaxed font-medium">
                    No es posible agendar una <strong className="text-white underline">extracción dental o procedimiento quirúrgico</strong> para este paciente porque{' '}
                    <strong className="text-white">NO tiene exámenes de sangre validados</strong> en el sistema (Hemograma / Tiempos de Coagulación).
                  </p>
                  <p className="text-[11px] text-rose-200">
                    Protocolo preventivo obligatorio: Esta restricción previene negligencias médicas y riesgos hemorrágicos severos durante la intervención.
                  </p>

                  {selectedPatient && onSelectPatientForValidation && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          onSelectPatientForValidation(selectedPatient.id);
                        }}
                        className="w-full py-1.5 px-3 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>🛡️</span>
                        <span>Ir a Validar Exámenes de Sangre para este paciente</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Rango de Horario y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={fechaCita}
                    onChange={(e) => setFechaCita(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mensajes de error del modal */}
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {modalError}
                </div>
              )}

              {/* Mensajes de éxito */}
              {modalSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  {modalSuccess}
                </div>
              )}

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submittingAppt}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submittingAppt || isSafetyBlocked}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                    isSafetyBlocked
                      ? 'bg-rose-300 text-white cursor-not-allowed border border-rose-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  }`}
                  title={isSafetyBlocked ? 'Bloqueado por alerta roja de seguridad pre-quirúrgica' : 'Agendar cita'}
                >
                  {submittingAppt ? (
                    'Agendando…'
                  ) : isSafetyBlocked ? (
                    <>
                      <span>🚫</span>
                      <span>Bloqueado por Seguridad Clínica</span>
                    </>
                  ) : (
                    'Confirmar y Agendar Cita'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
