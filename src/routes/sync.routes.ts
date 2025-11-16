import { Router } from 'express';
import { syncGroupMembers, syncGroupMembersWithJoinDate } from '../controllers/sync.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Sincronizar usuarios del grupo de Telegram (30 días desde ahora)
router.post('/sync-group', authenticate, syncGroupMembers);

// Sincronizar usuarios del grupo usando fecha de ingreso (30 días desde cuando se unieron)
router.post('/sync-group-with-date', authenticate, syncGroupMembersWithJoinDate);

export default router;
