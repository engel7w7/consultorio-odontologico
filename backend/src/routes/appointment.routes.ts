import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller.js';
import { AppointmentService } from '../services/appointment.service.js';
import { prisma } from '../config/prisma.js';

const router = Router();
const appointmentService = new AppointmentService(prisma);
const appointmentController = new AppointmentController(appointmentService);

router.get('/', appointmentController.getAppointments);
router.post('/', appointmentController.createAppointment);
router.patch('/:id/status', appointmentController.updateStatus);

export default router;
