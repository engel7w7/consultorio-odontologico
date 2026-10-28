import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service.js';
import {
  getAppointmentsQuerySchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  registerPaymentSchema,
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

      const errCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : error instanceof Error
            ? error.message
            : '';

      if (
        errCode === 'EXTRACTION_BLOOD_EXAMS_REQUIRED' ||
        (error instanceof Error && error.message.includes('ALERTA ROJA BLOQUEANTE'))
      ) {
        return res.status(422).json({
          error:
            'ALERTA ROJA BLOQUEANTE: No se puede agendar una extracción o procedimiento quirúrgico en un paciente sin exámenes de sangre validados.',
          code: 'EXTRACTION_BLOOD_EXAMS_REQUIRED',
        });
      }

      if (
        errCode === 'PATIENT_NOT_FOUND' ||
        (error instanceof Error && error.message === 'Paciente no encontrado')
      ) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      if (
        errCode === 'START_TIME_MUST_BE_BEFORE_END_TIME' ||
        (error instanceof Error &&
          error.message === 'La hora de inicio debe ser anterior a la hora de fin')
      ) {
        return res
          .status(400)
          .json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
      }

      console.error('Error al agendar cita:', error);
      return res.status(500).json({ error: 'Error interno al agendar la cita' });
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

  registerPayment = async (req: Request, res: Response) => {
    try {
      const parsed = registerPaymentSchema.parse(req.body);
      const appointment = await this.service.registerPayment(
        req.params.id as string,
        parsed.monto_pagado
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
      console.error('Error al registrar el cobro de la cita:', error);
      return res.status(500).json({ error: 'Error interno al registrar el cobro' });
    }
  };
}
