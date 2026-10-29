import { Router } from 'express';
import { PatientHistoryController } from '../controllers/patient-history.controller.js';
import { PatientHistoryService } from '../services/patient-history.service.js';
import { prisma } from '../config/prisma.js';

const router = Router({ mergeParams: true });
const patientHistoryService = new PatientHistoryService(prisma);
const patientHistoryController = new PatientHistoryController(patientHistoryService);

router.get('/', patientHistoryController.getHistory);

export default router;
