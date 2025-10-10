import sequelize from '../config/database.js';
import '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Creating database tables...');
    // Force sync will drop existing tables and recreate them
    // Use { force: false, alter: true } to update existing tables without dropping
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created successfully!');

    console.log('\n📊 Database initialization complete!');
    console.log('You can now start the server with: npm start\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('\nError details:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.log('\n⚠️  Permission Error Solution:');
      console.log('1. Grant permissions to your database user:');
      console.log('   GRANT ALL PRIVILEGES ON SCHEMA public TO your_db_user;');
      console.log('   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;');
      console.log('\n2. Or run this from the DigitalOcean database console as admin.');
    }
    
    process.exit(1);
  }
}

initDatabase();

