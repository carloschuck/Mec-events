import express from 'express';

const router = express.Router();

console.log('🔄 Routes module loaded successfully');

// Create a simple auth route directly here to test
console.log('🔄 Creating simple auth routes...');
router.post('/auth/login', (req, res) => {
  console.log('📝 Login route called with body:', req.body);
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

// Simple test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route working',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Simple auth routes created');

// Debug: List all registered routes
console.log('🔍 Registered routes:');
router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    console.log(`  ${methods} ${layer.route.path}`);
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Database setup endpoint
router.get('/setup-db', async (req, res) => {
  try {
    console.log('🔍 Running database setup check...');
    
    // Import required modules
    const { User } = await import('../models/index.js');
    const bcrypt = (await import('bcryptjs')).default;
    
    // Check if admin user exists
    const adminEmail = 'admin@housesoflight.org';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      res.json({
        success: true,
        message: 'Database is properly set up',
        adminUser: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          firstName: existingAdmin.firstName,
          lastName: existingAdmin.lastName,
          role: existingAdmin.role,
          isActive: existingAdmin.isActive
        }
      });
    } else {
      console.log('❌ Admin user does not exist. Creating...');
      
      const adminPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });

      console.log(`✅ Admin user created: ${adminEmail}`);
      res.json({
        success: true,
        message: 'Admin user created successfully',
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role,
          isActive: adminUser.isActive
        },
        defaultPassword: 'admin123'
      });
    }
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up database',
      error: error.message
    });
  }
});

// Catch-all route for debugging (must be last)
router.all('*', (req, res) => {
  console.log('🔍 Unhandled route:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    path: req.path
  });
});

export default router;

