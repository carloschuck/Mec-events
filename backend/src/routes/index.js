import express from 'express';

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

// Simple auth routes for testing
router.post('/auth/login', (req, res) => {
  console.log('📝 Login endpoint called with body:', req.body);
  res.json({
    success: true,
    message: 'Login endpoint working',
    timestamp: new Date().toISOString()
  });
});

router.get('/auth/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth test endpoint working'
  });
});

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

