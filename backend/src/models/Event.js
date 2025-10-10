import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mecEventId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Event ID from MEC WordPress plugin'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE
  },
  location: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'upcoming'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional data from MEC API'
  },
  lastSyncedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'events',
  timestamps: true,
  indexes: [
    { fields: ['mecEventId'] },
    { fields: ['startDate'] },
    { fields: ['status'] }
  ]
});

export default Event;

