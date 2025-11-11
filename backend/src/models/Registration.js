import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Registration = sequelize.define('Registration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mecBookingId: {
    type: DataTypes.STRING,
    comment: 'Booking ID from MEC WordPress plugin'
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'WordPress site URL where booking originates'
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  attendeeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  attendeeEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  attendeePhone: {
    type: DataTypes.STRING
  },
  numberOfTickets: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  attendeeIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Zero-based index for multi-attendee bookings'
  },
  registrationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  qrCode: {
    type: DataTypes.TEXT,
    comment: 'QR code data URL or path'
  },
  checkedIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  checkedInAt: {
    type: DataTypes.DATE
  },
  checkedInBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminderSentAt: {
    type: DataTypes.DATE
  },
  followUpSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  followUpSentAt: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional data from MEC booking'
  }
}, {
  tableName: 'registrations',
  timestamps: true,
  indexes: [
    { fields: ['eventId'] },
    { fields: ['sourceUrl'] },
    { fields: ['attendeeEmail'] },
    { fields: ['checkedIn'] },
    { fields: ['registrationDate'] },
    { fields: ['attendeeIndex'] },
    {
      unique: true,
      fields: ['sourceUrl', 'mecBookingId', 'attendeeIndex'],
      name: 'unique_booking_per_site'
    }
  ]
});

export default Registration;

