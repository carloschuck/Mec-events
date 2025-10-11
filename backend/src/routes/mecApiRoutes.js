import express from 'express';
import { 
  testConnection,
  getConfig,
  getEvents,
  getEvent,
  getEventTickets,
  getEventFees,
  login,
  syncEvents,
  syncBookings,
  cleanupOldEvents,
  cleanupSourceUrlDuplicates,
  debugEventIds,
  debugBookingMatch
} from '../controllers/mecApiController.js';

const router = express.Router();

// Test MEC API connection
router.get('/test', testConnection);

// Get MEC API configuration
router.get('/config', getConfig);

// Get events from MEC API
router.get('/events', getEvents);

// Get single event from MEC API
router.get('/events/:id', getEvent);

// Get event tickets from MEC API
router.get('/events/:id/tickets', getEventTickets);

// Get event fees from MEC API
router.get('/events/:id/fees', getEventFees);

// Login to MEC API
router.post('/login', login);

// Sync events from MEC API to local database
router.post('/sync/events', syncEvents);

// Sync bookings/registrations from MEC API to local database
router.post('/sync/bookings', syncBookings);

// Clean up old events from the database
router.delete('/cleanup/old-events', cleanupOldEvents);

// Clean up duplicate events with sourceUrl trailing slash
router.delete('/cleanup/sourceurl-duplicates', cleanupSourceUrlDuplicates);

// Debug: Get event IDs in database
router.get('/debug/event-ids', debugEventIds);

// Debug: Test booking match
router.get('/debug/test-booking-match', debugBookingMatch);

export default router;