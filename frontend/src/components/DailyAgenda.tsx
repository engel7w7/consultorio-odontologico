import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import type { DatesSetArg, EventContentArg } from '@fullcalendar/core';
import type { Appointment, EstadoCita } from '../types/appointment';
import './DailyAgenda.css';

export const DailyAgenda: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchAppointments = useCallback(async (date: string) => {
    // Aborta la petición anterior si todavía está pendiente
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
        // Petición cancelada por una nueva navegación: se ignora sin alterar el estado de carga de la petición nueva
        return;
      }
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor';
      setError(msg);
      setAppointments([]);
      setLoading(false);
    }
  }, []);

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

  // Fecha de referencia hoy en Bolivia (America/La_Paz, UTC-4) inicializada una vez al montar
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

  // Formato legible en español: "Martes 13 de octubre"
  const formattedHeaderDate = useMemo(() => {
    if (!selectedDate) return '';
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = new Intl.DateTimeFormat('es-BO', { weekday: 'long' }).format(date);
    const monthName = new Intl.DateTimeFormat('es-BO', { month: 'long' }).format(date);
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capWeekday} ${day} de ${monthName}`;
  }, [selectedDate]);

  // Resumen calculado: "6 citas · 2 atendidas · 1 cancelada"
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

  // Desplazamiento automático a la primera cita o a la hora actual
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
        estado: appt.estado,
        motivo: appt.motivo,
      },
    }));
  }, [appointments]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { patientName, estado, motivo } = eventInfo.event.extendedProps as {
      patientName: string;
      estado: EstadoCita;
      motivo: string;
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
          <div className="agenda-event__content flex flex-col justify-center gap-0.5 overflow-hidden">
            <div className={`text-xs truncate ${nameStyles}`}>
              {estado === 'ATENDIDA' && (
                <span
                  className="agenda-event__status inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold align-middle"
                  aria-label="Cita atendida"
                >
                  ✓ Atendida
                </span>
              )}
              {patientName}
            </div>
            <div className={`text-[11px] tabular-nums truncate flex items-center gap-1.5 ${metaStyles}`}>
              <span>{timeRange}</span>
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
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 daily-agenda">
      {/* Encabezado clínico y sobrio */}
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

        {/* Navegación compacta */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
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

      {/* Aviso de error sobrio y discreto */}
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
    </div>
  );
};
