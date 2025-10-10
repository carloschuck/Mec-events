import express from 'express';

const router = express.Router();

// Create a simple auth route directly here to test
console.log('🔄 Creating simple auth routes...');
router.post('/auth/login', (req, res) => {
  console.log('📝 Login route called');
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

console.log('✅ Simple auth routes created');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;

