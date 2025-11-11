import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import registrationRoutes from './registrationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import mecApiRoutes from './mecApiRoutes.js';
import attendeeRoutes from './attendeeRoutes.js';

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

// Database health check endpoint
router.get('/db-health', async (req, res) => {
  try {
    console.log('📝 Database health endpoint called');
    const { sequelize } = await import('../models/index.js');
    
    // Test database connection
    await sequelize.authenticate();
    
    // Check if admin user exists
    const { User } = await import('../models/index.js');
    const adminUser = await User.findOne({ 
      where: { email: 'admin@housesoflight.org' } 
    });
    
    res.json({
      success: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
      adminUserExists: !!adminUser,
      adminUserEmail: adminUser ? adminUser.email : null
    });
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount all route modules
console.log('🔄 Mounting route modules...');
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/mec-api', mecApiRoutes);
router.use('/attendees', attendeeRoutes);
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

// Delete admin user endpoint (for fixing password issues)
router.delete('/admin-user', async (req, res) => {
  try {
    console.log('🗑️ Deleting admin user...');
    
    const { User } = await import('../models/index.js');
    const deleted = await User.destroy({ 
      where: { email: 'admin@housesoflight.org' } 
    });
    
    res.json({
      success: true,
      message: `Admin user deleted. Rows affected: ${deleted}`
    });
  } catch (error) {
    console.error('❌ Error deleting admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin user',
      error: error.message
    });
  }
});

// Sync bookings endpoint
router.post('/sync-bookings', async (req, res) => {
  try {
    console.log('🔄 Manual booking sync endpoint called');
    
    // Import the sync script
    const syncProductionBookings = await import('../scripts/sync-production-bookings.js');
    
    // Run the sync
    await syncProductionBookings.default();
    
    res.json({
      success: true,
      message: 'Booking sync completed successfully'
    });
  } catch (error) {
    console.error('❌ Booking sync failed:', error);
    res.status(500).json({
      success: false,
      message: 'Booking sync failed',
      error: error.message
    });
  }
});

// Run attendeeIndex migration endpoint
router.post('/migrate/attendee-index', async (req, res) => {
  try {
    console.log('🔄 Running attendeeIndex migration...');
    
    const { sequelize } = await import('../models/index.js');
    const { QueryTypes } = await import('sequelize');
    
    // Add column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE registrations
      ADD COLUMN IF NOT EXISTS "attendeeIndex" INTEGER DEFAULT 0 NOT NULL
    `);

    // Populate from metadata
    await sequelize.query(
      `
      UPDATE registrations
      SET "attendeeIndex" = COALESCE(
        (metadata->>'attendeeIndex')::INTEGER,
        0
      )
      WHERE "attendeeIndex" IS NULL
      `,
      { type: QueryTypes.UPDATE }
    );

    // Drop old index if exists
    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public' AND indexname = 'unique_booking_per_site'
        ) THEN
          DROP INDEX unique_booking_per_site;
        END IF;
      END $$;
    `);

    // Create new unique index
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_per_site
      ON registrations("sourceUrl", "mecBookingId", "attendeeIndex")
    `);

    res.json({
      success: true,
      message: 'attendeeIndex migration completed successfully'
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
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

