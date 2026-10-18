import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { prisma } from '../config/prisma.js';

const router = Router();
const authService = new AuthService(prisma);
const authController = new AuthController(authService);

router.post('/login', authController.login);
router.get('/me', authController.me);

export default router;
