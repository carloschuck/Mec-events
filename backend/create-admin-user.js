import { User } from './src/models/index.js';
import sequelize from './src/config/database.js';

async function createAdminUser() {
  try {
    console.log('🔍 Creating admin user...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@housesoflight.org' } 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Active: ${existingAdmin.isActive}`);
      return;
    }
    
    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@housesoflight.org',
      password: 'admin123', // Will be hashed by the model hook
      role: 'admin',
      isActive: true,
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Active: ${adminUser.isActive}`);
    
    console.log('\n🔑 Login credentials:');
    console.log(`   Email: admin@housesoflight.org`);
    console.log(`   Password: admin123`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();
