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
  cleanupOldEvents
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

// Clean up old events from the database
router.delete('/cleanup/old-events', cleanupOldEvents);

export default router;