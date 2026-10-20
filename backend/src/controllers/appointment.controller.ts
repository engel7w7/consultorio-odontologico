import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service.js';
import {
  getAppointmentsQuerySchema,
  updateAppointmentStatusSchema,
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

  updateStatus = async (req: Request, res: Response) => {
    try {
      const parsed = updateAppointmentStatusSchema.parse(req.body);
      const appointment = await this.service.updateAppointmentStatus(
        req.params.id as string,
        parsed.estado
      );
      return res.status(200).json(appointment);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación',
          issues: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Cita no encontrada') {
        return res.status(404).json({ error: error.message });
      }

      console.error('Error al actualizar el estado de la cita:', error);
      return res.status(500).json({ error: 'Error interno al actualizar la cita' });
    }
  };
}
