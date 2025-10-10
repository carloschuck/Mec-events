import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
console.log('🔄 Importing routes...');
import routes from './routes/index.js';
console.log('✅ Routes imported successfully');
import { errorHandler, notFound } from './middleware/errorHandler.js';
import cronJobs from './cron/jobs.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MEC Dashboard API',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync database models
    // Skip sync if DB_SKIP_SYNC is set (for managed databases with permission restrictions)
    if (process.env.DB_SKIP_SYNC !== 'true') {
      if (process.env.NODE_ENV === 'production') {
        // In production, use alter to modify existing tables
        try {
          await sequelize.sync({ alter: true });
          console.log('✅ Database models synchronized');
        } catch (syncError) {
          console.warn('⚠️  Database sync failed (this is normal for managed databases):', syncError.message);
          console.log('ℹ️  Skipping database sync. Tables should be created manually or via migrations.');
        }
      } else {
        await sequelize.sync({ force: false });
        console.log('✅ Database models synced');
      }
    } else {
      console.log('ℹ️  Database sync skipped (DB_SKIP_SYNC=true)');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);

      // Start cron jobs
      if (process.env.NODE_ENV !== 'test') {
        cronJobs.startAll();
      }
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  cronJobs.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  cronJobs.stopAll();
  process.exit(0);
});

startServer();

export default app;

