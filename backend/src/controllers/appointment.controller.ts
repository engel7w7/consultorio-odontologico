import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service.js';
import {
  getAppointmentsQuerySchema,
  createAppointmentSchema,
} from '../schemas/appointment.schema.js';
import { z } from 'zod';

export class AppointmentController {
  constructor(private service: AppointmentService) {}

  getAppointments = async (req: Request, res: Response) => {
    try {
      const parsed = getAppointmentsQuerySchema.parse(req.query);
      const appointments = await this.service.getDailyAppointments(parsed.date);
      return res.status(200).json(appointments);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación',
          issues: error.issues,
        });
      }
      console.error('Error al consultar la agenda:', error);
      return res.status(500).json({ error: 'Error interno al consultar la agenda' });
    }
  };

  createAppointment = async (req: Request, res: Response) => {
    try {
      const parsed = createAppointmentSchema.parse(req.body);
      const appointment = await this.service.createAppointment(parsed);
      return res.status(201).json(appointment);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación',
          issues: error.issues,
        });
      }

      if (error instanceof Error) {
        if (error.message === 'EXTRACTION_BLOOD_EXAMS_REQUIRED') {
          return res.status(422).json({
            error:
              'ALERTA ROJA BLOQUEANTE: No se puede agendar una extracción o procedimiento quirúrgico en un paciente sin exámenes de sangre validados.',
            code: 'EXTRACTION_BLOOD_EXAMS_REQUIRED',
          });
        }
        if (error.message === 'PATIENT_NOT_FOUND') {
          return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        if (error.message === 'START_TIME_MUST_BE_BEFORE_END_TIME') {
          return res
            .status(400)
            .json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
        }
      }

      console.error('Error al agendar cita:', error);
      return res.status(500).json({ error: 'Error interno al agendar la cita' });
    }
  };
}
