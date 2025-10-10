import sequelize from '../config/database.js';
import User from './User.js';
import Event from './Event.js';
import Registration from './Registration.js';

// Define associations
Event.hasMany(Registration, {
  foreignKey: 'eventId',
  as: 'registrations',
  onDelete: 'CASCADE'
});

Registration.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event'
});

User.hasMany(Registration, {
  foreignKey: 'checkedInBy',
  as: 'checkedInRegistrations'
});

Registration.belongsTo(User, {
  foreignKey: 'checkedInBy',
  as: 'checkedInByUser'
});

// Sync function
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synced successfully');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

export { sequelize, User, Event, Registration };

