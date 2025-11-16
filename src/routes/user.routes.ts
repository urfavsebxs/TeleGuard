import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  extendSubscription,
  reduceSubscription,
  getStats,
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Validaciones
const createUserValidation = [
  body('telegramId').notEmpty().withMessage('Telegram ID es obligatorio'),
  body('firstName').notEmpty().withMessage('Nombre es obligatorio'),
  body('paymentDurationDays')
    .isInt({ min: 1 })
    .withMessage('Duración del pago debe ser al menos 1 día'),
];

const updateUserValidation = [
  body('paymentDurationDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duración del pago debe ser al menos 1 día'),
];

const extendSubscriptionValidation = [
  body('additionalDays')
    .isInt({ min: 1 })
    .withMessage('Días adicionales deben ser al menos 1'),
];

const reduceSubscriptionValidation = [
  body('daysToReduce')
    .isInt({ min: 1 })
    .withMessage('Días a reducir deben ser al menos 1'),
];

// Rutas
router.get('/stats', getStats);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', validate(createUserValidation), createUser);
router.put('/:id', validate(updateUserValidation), updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/extend', validate(extendSubscriptionValidation), extendSubscription);
router.post('/:id/reduce', validate(reduceSubscriptionValidation), reduceSubscription);

export default router;
