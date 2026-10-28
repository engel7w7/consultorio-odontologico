export type EstadoCita = 'PROGRAMADA' | 'ATENDIDA' | 'CANCELADA';

export interface AppointmentPatient {
  id: string;
  nombre: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient: AppointmentPatient;
  motivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoCita;
  monto_pagado: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentPayload {
  patient_id: string;
  motivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: EstadoCita;
}
