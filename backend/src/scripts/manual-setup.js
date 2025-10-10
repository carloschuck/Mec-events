import sequelize from '../config/database.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function manualSetup() {
  try {
    console.log('🚀 Starting manual database setup...');
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create tables if they don't exist
    console.log('🔍 Creating database tables...');
    await sequelize.sync({ force: false });
    console.log('✅ Database tables created/verified');

    // Check if admin user exists
    console.log('🔍 Checking for admin user...');
    const adminEmail = 'admin@housesoflight.org';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      console.log('👤 Admin user details:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        firstName: existingAdmin.firstName,
        lastName: existingAdmin.lastName,
        role: existingAdmin.role,
        isActive: existingAdmin.isActive
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
      console.log('👤 Admin user details:', {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        isActive: adminUser.isActive
      });
      console.log('🔑 Default password: admin123');
    }

    // Check total users
    const userCount = await User.count();
    console.log(`📊 Total users in database: ${userCount}`);

    // Check events and registrations
    const eventCount = await Event.count();
    const registrationCount = await Registration.count();
    console.log(`📊 Total events: ${eventCount}`);
    console.log(`📊 Total registrations: ${registrationCount}`);

    console.log('🎉 Manual setup completed successfully!');
    console.log('🔑 You can now login with:');
    console.log('   Email: admin@housesoflight.org');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error during manual setup:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

manualSetup();
