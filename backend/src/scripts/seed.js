import dotenv from 'dotenv';
import { sequelize, User, Event, Registration } from '../models/index.js';
import qrService from '../services/qrService.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synced\n');

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Admin user created:', admin.email);

    // Create staff user
    const staff = await User.create({
      email: 'staff@example.com',
      password: 'staff123',
      firstName: 'Staff',
      lastName: 'User',
      role: 'staff',
      isActive: true
    });
    console.log('✅ Staff user created:', staff.email);

    // Create sample events
    const event1 = await Event.create({
      mecEventId: 'sample-1',
      title: 'Sunday Service',
      description: 'Join us for our weekly Sunday service',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      location: 'Main Sanctuary',
      address: '123 Church Street, City, State 12345',
      capacity: 100,
      status: 'upcoming',
      lastSyncedAt: new Date()
    });
    console.log('✅ Event created:', event1.title);

    const event2 = await Event.create({
      mecEventId: 'sample-2',
      title: 'Youth Group Meeting',
      description: 'Monthly youth group gathering',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: 'Youth Hall',
      address: '123 Church Street, City, State 12345',
      capacity: 50,
      status: 'upcoming',
      lastSyncedAt: new Date()
    });
    console.log('✅ Event created:', event2.title);

    const event3 = await Event.create({
      mecEventId: 'sample-3',
      title: 'Bible Study',
      description: 'Weekly Bible study session',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
      location: 'Prayer Room',
      address: '123 Church Street, City, State 12345',
      capacity: 30,
      status: 'upcoming',
      lastSyncedAt: new Date()
    });
    console.log('✅ Event created:', event3.title);

    // Create sample registrations
    const sampleAttendees = [
      { name: 'John Doe', email: 'john@example.com', phone: '555-0101' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102' },
      { name: 'Bob Johnson', email: 'bob@example.com', phone: '555-0103' },
      { name: 'Alice Williams', email: 'alice@example.com', phone: '555-0104' },
      { name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-0105' },
    ];

    for (const attendee of sampleAttendees) {
      // Register for event 1
      const reg1 = await Registration.create({
        mecBookingId: `booking-${event1.id}-${attendee.email}`,
        eventId: event1.id,
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        attendeePhone: attendee.phone,
        numberOfTickets: Math.floor(Math.random() * 3) + 1,
        registrationDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        checkedIn: Math.random() > 0.5,
        checkedInAt: Math.random() > 0.5 ? new Date() : null,
        checkedInBy: Math.random() > 0.5 ? staff.id : null
      });

      // Generate QR code
      const qrCode = await qrService.generateQRCode(reg1.id);
      await reg1.update({ qrCode });

      // Register for event 3
      const reg3 = await Registration.create({
        mecBookingId: `booking-${event3.id}-${attendee.email}`,
        eventId: event3.id,
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        attendeePhone: attendee.phone,
        numberOfTickets: 1,
        registrationDate: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)
      });

      const qrCode3 = await qrService.generateQRCode(reg3.id);
      await reg3.update({ qrCode: qrCode3 });

      console.log(`✅ Registrations created for ${attendee.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📧 Admin credentials: admin@example.com / admin123');
    console.log('📧 Staff credentials: staff@example.com / staff123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

