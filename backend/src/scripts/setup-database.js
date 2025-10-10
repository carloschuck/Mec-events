import sequelize from '../config/database.js';
import { User, Event, Registration } from '../models/index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  try {
    // 1. Test database connection
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 2. Create tables
    console.log('🔍 Creating database tables...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables created/verified');

    // 3. Create admin user
    console.log('🔍 Creating admin user...');
    const adminEmail = 'admin@housesoflight.org';
    const adminPassword = 'admin123';

    let adminUser = await User.findOne({ where: { email: adminEmail } });

    if (adminUser) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });
      
      console.log(`✅ Admin user created: ${adminEmail}`);
    }

    // 4. Report status
    const totalUsers = await User.count();
    const totalEvents = await Event.count();
    const totalRegistrations = await Registration.count();

    console.log('\n📊 Database Status:');
    console.log(`   Users: ${totalUsers}`);
    console.log(`   Events: ${totalEvents}`);
    console.log(`   Registrations: ${totalRegistrations}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Error during database setup:', error);
    throw error; // Re-throw instead of process.exit for API usage
  }
  // Note: Don't close the connection when used via API - let the server manage it
}

// Export the function for use in API endpoints
export { setupDatabase };

// Only run automatically if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().finally(async () => {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  });
}
