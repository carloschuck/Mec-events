import express from 'express';
import { handleMecWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// MEC webhook endpoint (no auth required - verified by signature)
router.post('/mec', handleMecWebhook);

export default router;

