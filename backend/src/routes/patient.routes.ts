import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';
import { PatientService } from '../services/patient.service.js';
import { prisma } from '../config/prisma.js';

const router = Router();
const patientService = new PatientService(prisma);
const patientController = new PatientController(patientService);

router.post('/', patientController.createPatient);
router.get('/', patientController.getAll);
router.patch('/:id/blood-exams', patientController.updateExamStatus);

export default router;
