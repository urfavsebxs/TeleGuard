import { Router } from 'express';
import { login, verifyToken } from '../controllers/auth.controller';

const router = Router();

// Rutas públicas (sin autenticación)
router.post('/login', login);
router.get('/verify', verifyToken);

export default router;
