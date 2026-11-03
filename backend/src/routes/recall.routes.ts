import { Router } from 'express';
import { RecallController } from '../controllers/recall.controller.js';
import { RecallService } from '../services/recall.service.js';
import { prisma } from '../config/prisma.js';

const router = Router();
const recallService = new RecallService(prisma);
const recallController = new RecallController(recallService);

router.get('/profilaxis-vencidas', recallController.getProfilaxisVencidas);
router.get('/retorno-mensual', recallController.getRetornoMensual);

export default router;
