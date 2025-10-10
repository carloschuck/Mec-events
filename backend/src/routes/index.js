import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import registrationRoutes from './registrationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import webhookRoutes from './webhookRoutes.js';

const router = express.Router();

console.log('🔄 Routes module loaded successfully');

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('📝 Health endpoint called');
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount all route modules
console.log('🔄 Mounting route modules...');
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/webhooks', webhookRoutes);
console.log('✅ All route modules mounted successfully');

// Database setup endpoint
router.post('/setup-db', async (req, res) => {
  try {
    console.log('🗄️ Database setup endpoint called');
    
    // Import the setup script
    const { setupDatabase } = await import('../scripts/setup-database.js');
    
    // Run the setup
    await setupDatabase();
    
    res.json({
      success: true,
      message: 'Database setup completed successfully'
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database setup failed',
      error: error.message
    });
  }
});

// Debug: List all registered routes
console.log('🔍 Registered routes:');
router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    console.log(`  ${methods} ${layer.route.path}`);
  }
});

console.log('✅ Routes created successfully');

export default router;

