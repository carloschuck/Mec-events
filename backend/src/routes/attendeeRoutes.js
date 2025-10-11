import express from 'express';
import {
  getAttendees,
  getAttendeeStats,
  exportAttendeesPDF,
  exportAttendeesCSV,
  getAttendeeFilters
} from '../controllers/attendeeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get attendees with filtering and pagination
router.get('/', protect, getAttendees);

// Get attendee statistics
router.get('/stats', protect, getAttendeeStats);

// Get filter options for attendees
router.get('/filters', protect, getAttendeeFilters);

// Export attendees as PDF
router.get('/export/pdf', protect, exportAttendeesPDF);

// Export attendees as CSV
router.get('/export/csv', protect, exportAttendeesCSV);

export default router;
