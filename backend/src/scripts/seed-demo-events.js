import { sequelize, Event, Registration, User } from '../models/index.js';
import dotenv from 'dotenv';
import qrService from '../services/qrService.js';

dotenv.config();

const seedDemoData = async () => {
  try {
    console.log('🌱 Seeding demo events and registrations...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find admin user
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.error('❌ No admin user found. Please create one first.');
      return;
    }

    // Create demo events
    const events = [
      {
        mecEventId: 'demo-001',
        title: 'Sunday Worship Service',
        description: 'Join us for our weekly worship service with inspiring messages and uplifting music.',
        startDate: new Date('2025-10-12T10:00:00'),
        endDate: new Date('2025-10-12T12:00:00'),
        location: 'Houses of Light Church',
        address: '123 Faith Avenue, City, State 12345',
        capacity: 200,
        imageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
        status: 'upcoming',
        metadata: { type: 'worship', category: 'regular' },
        lastSyncedAt: new Date()
      },
      {
        mecEventId: 'demo-002',
        title: 'Youth Group Meeting',
        description: 'Weekly gathering for youth ages 13-18. Games, fellowship, and faith-based discussions.',
        startDate: new Date('2025-10-15T18:00:00'),
        endDate: new Date('2025-10-15T20:00:00'),
        location: 'Youth Center',
        address: '123 Faith Avenue, City, State 12345',
        capacity: 50,
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
        status: 'upcoming',
        metadata: { type: 'youth', category: 'weekly' },
        lastSyncedAt: new Date()
      },
      {
        mecEventId: 'demo-003',
        title: 'Community Outreach Event',
        description: 'Serving our community with food, clothing, and hope. Volunteers welcome!',
        startDate: new Date('2025-10-20T09:00:00'),
        endDate: new Date('2025-10-20T15:00:00'),
        location: 'Community Center',
        address: '456 Hope Street, City, State 12345',
        capacity: 150,
        imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
        status: 'upcoming',
        metadata: { type: 'outreach', category: 'special' },
        lastSyncedAt: new Date()
      },
      {
        mecEventId: 'demo-004',
        title: 'Bible Study - Gospel of John',
        description: 'Deep dive into the Gospel of John. All are welcome to join us in studying God\'s word.',
        startDate: new Date('2025-10-17T19:00:00'),
        endDate: new Date('2025-10-17T20:30:00'),
        location: 'Fellowship Hall',
        address: '123 Faith Avenue, City, State 12345',
        capacity: 40,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        status: 'upcoming',
        metadata: { type: 'study', category: 'weekly' },
        lastSyncedAt: new Date()
      }
    ];

    console.log('Creating events...');
    const createdEvents = [];
    for (const eventData of events) {
      const [event] = await Event.upsert(eventData, {
        conflictFields: ['mecEventId']
      });
      createdEvents.push(event);
      console.log(`✅ Created: ${event.title}`);
    }

    console.log('\nCreating demo registrations...');
    
    const attendees = [
      { name: 'John Smith', email: 'john.smith@example.com', phone: '555-0101' },
      { name: 'Mary Johnson', email: 'mary.johnson@example.com', phone: '555-0102' },
      { name: 'David Williams', email: 'david.williams@example.com', phone: '555-0103' },
      { name: 'Sarah Brown', email: 'sarah.brown@example.com', phone: '555-0104' },
      { name: 'Michael Davis', email: 'michael.davis@example.com', phone: '555-0105' },
      { name: 'Jennifer Wilson', email: 'jennifer.wilson@example.com', phone: '555-0106' },
      { name: 'James Martinez', email: 'james.martinez@example.com', phone: '555-0107' },
      { name: 'Patricia Garcia', email: 'patricia.garcia@example.com', phone: '555-0108' }
    ];

    let registrationCount = 0;
    for (const event of createdEvents) {
      // Random number of registrations per event (3-8)
      const numRegistrations = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < numRegistrations && i < attendees.length; i++) {
        const attendee = attendees[i];
        const isCheckedIn = Math.random() > 0.5; // 50% chance of being checked in
        
        const registrationData = {
          mecBookingId: `demo-reg-${registrationCount++}`,
          eventId: event.id,
          attendeeName: attendee.name,
          attendeeEmail: attendee.email,
          attendeePhone: attendee.phone,
          numberOfTickets: Math.floor(Math.random() * 3) + 1,
          registrationDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
          qrCode: await qrService.generateQRCode(`reg-demo-${registrationCount}`),
          checkedIn: isCheckedIn,
          checkedInAt: isCheckedIn ? new Date() : null,
          checkedInBy: isCheckedIn ? admin.id : null,
          metadata: { source: 'demo', attendeeType: 'member' }
        };

        await Registration.upsert(registrationData, {
          conflictFields: ['mecBookingId']
        });
      }
      console.log(`✅ Created ${numRegistrations} registrations for: ${event.title}`);
    }

    console.log('\n🎉 Demo data seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Events: ${createdEvents.length}`);
    console.log(`   Registrations: ${registrationCount}`);
    console.log('\n✅ You can now test the dashboard with real data!\n');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  } finally {
    await sequelize.close();
  }
};

seedDemoData();

