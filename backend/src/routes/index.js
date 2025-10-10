import express from 'express';

const router = express.Router();

// Temporarily comment out route imports to test
// import authRoutes from './authRoutes.js';
// import eventRoutes from './eventRoutes.js';
// import registrationRoutes from './registrationRoutes.js';
// import dashboardRoutes from './dashboardRoutes.js';
// import webhookRoutes from './webhookRoutes.js';

// router.use('/auth', authRoutes);
// router.use('/events', eventRoutes);
// router.use('/registrations', registrationRoutes);
// router.use('/dashboard', dashboardRoutes);
// router.use('/webhooks', webhookRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;

