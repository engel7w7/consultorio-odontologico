import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service.js';
import { getAppointmentsQuerySchema } from '../schemas/appointment.schema.js';
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
}
