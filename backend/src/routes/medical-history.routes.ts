import { Router } from 'express';
import { MedicalHistoryController } from '../controllers/medical-history.controller.js';
import { MedicalHistoryService } from '../services/medical-history.service.js';
import { prisma } from '../config/prisma.js';

const router = Router({ mergeParams: true });
const medicalHistoryService = new MedicalHistoryService(prisma);
const medicalHistoryController = new MedicalHistoryController(medicalHistoryService);

router.get('/audit', medicalHistoryController.getAuditHistory);
router.get('/', medicalHistoryController.getMedicalHistory);
router.put('/', medicalHistoryController.upsertMedicalHistory);

export default router;
