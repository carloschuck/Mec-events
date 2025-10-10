import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  getMe, 
  updateProfile,
  changePassword 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').optional().isIn(['admin', 'staff']),
    validate
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
  ],
  login
);

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    validate
  ],
  updateProfile
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
    validate
  ],
  changePassword
);

export default router;

