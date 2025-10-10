import express from 'express';
import { body } from 'express-validator';
import {
  getRegistrations,
  getRegistration,
  checkIn,
  checkInByQR,
  undoCheckIn,
  generateQRCode,
  sendReminder
} from '../controllers/registrationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.get('/', protect, getRegistrations);
router.get('/:id', protect, getRegistration);
router.post('/:id/checkin', protect, checkIn);
router.post(
  '/checkin/qr',
  protect,
  [
    body('qrData').notEmpty(),
    validate
  ],
  checkInByQR
);
router.post('/:id/undo-checkin', protect, undoCheckIn);
router.get('/:id/qrcode', protect, generateQRCode);
router.post('/:id/reminder', protect, authorize('admin'), sendReminder);

export default router;

