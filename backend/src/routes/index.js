import express from 'express';
import authRoutes from './authRoutes.js';
// import eventRoutes from './eventRoutes.js';
// import registrationRoutes from './registrationRoutes.js';
// import dashboardRoutes from './dashboardRoutes.js';
// import webhookRoutes from './webhookRoutes.js';

const router = express.Router();

console.log('🔄 Loading auth routes...');
router.use('/auth', authRoutes);
console.log('✅ Auth routes loaded');

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

