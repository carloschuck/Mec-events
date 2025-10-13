import { User } from './src/models/index.js';
import sequelize from './src/config/database.js';

async function testProductionDB() {
  try {
    console.log('🔍 Testing production database connection...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if admin user exists
    console.log('🔍 Checking for admin user...');
    const adminUser = await User.findOne({ 
      where: { email: 'admin@housesoflight.org' } 
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.isActive}`);
      console.log(`   Created: ${adminUser.createdAt}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Check total users
    const userCount = await User.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // List all users
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt']
    });
    
    console.log('\n📋 All users:');
    allUsers.forEach(user => {
      console.log(`   ${user.id}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

testProductionDB();
