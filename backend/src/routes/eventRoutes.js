import express from 'express';
import {
  getEvents,
  getEvent,
  syncEvents,
  exportEventPDF,
  exportEventCSV,
  getEventAnalytics,
  getEventFilters,
  deleteEvent,
  testMecConnection
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/test-mec', protect, authorize('admin'), testMecConnection);
router.get('/filters', protect, getEventFilters);
router.get('/', protect, getEvents);
router.get('/:id', protect, getEvent);
router.get('/:id/analytics', protect, getEventAnalytics);
router.post('/sync', protect, authorize('admin'), syncEvents);
router.get('/:id/export/pdf', protect, exportEventPDF);
router.get('/:id/export/csv', protect, exportEventCSV);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

export default router;

