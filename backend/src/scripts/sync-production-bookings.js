import axios from 'axios';
import { Event, Registration } from '../models/index.js';
import sequelize from '../config/database.js';

async function syncProductionBookings() {
  try {
    console.log('🔄 Starting production booking sync...');
    
    const baseURL = 'https://housesoflight.org';
    const apiURL = `${baseURL}/wp-json/mec-bridge/v1`;
    
    // Get all bookings from WordPress
    console.log('📝 Fetching all bookings from WordPress...');
    const bookingsResponse = await axios.get(`${apiURL}/bookings`, {
      timeout: 10000
    });
    
    const bookings = bookingsResponse.data;
    console.log(`Found ${bookings.length} bookings to sync`);
    
    let synced = 0;
    let errors = 0;
    let skipped = 0;
    
    for (const booking of bookings) {
      try {
        // Find the corresponding event in our database
        const event = await Event.findOne({
          where: { 
            mecEventId: String(booking.event_id),
            sourceUrl: baseURL
          }
        });

        if (!event) {
          console.log(`⚠️  Event not found for booking ${booking.id} (Event ID: ${booking.event_id})`);
          skipped++;
          continue;
        }

        // Check if registration already exists
        const existingRegistration = await Registration.findOne({
          where: {
            mecBookingId: String(booking.id),
            sourceUrl: baseURL
          }
        });

        if (existingRegistration) {
          console.log(`⏭️  Registration already exists for booking ${booking.id}`);
          skipped++;
          continue;
        }

        // Create registration record
        const registrationData = {
          mecBookingId: String(booking.id),
          sourceUrl: baseURL,
          eventId: event.id,
          attendeeName: booking.name || 'Unknown',
          attendeeEmail: booking.email || '',
          attendeePhone: booking.phone || '',
          numberOfTickets: parseInt(booking.tickets || booking.count || 1),
          registrationDate: booking.date ? new Date(booking.date) : new Date(),
          metadata: booking
        };

        await Registration.create(registrationData);
        console.log(`✅ Synced booking ${booking.id}: ${registrationData.attendeeName} (${registrationData.attendeeEmail}) for event: ${event.title}`);
        synced++;
        
      } catch (error) {
        console.error(`❌ Error syncing booking ${booking.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`   ✅ Synced: ${synced}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total processed: ${bookings.length}`);

    // Check the specific event after sync
    console.log('\n🔍 Checking "Taller de salud Física" registrations after sync...');
    const saludEvent = await Event.findOne({
      where: {
        title: {
          [sequelize.Sequelize.Op.iLike]: '%Taller de salud Física%'
        }
      },
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: ['id', 'attendeeName', 'attendeeEmail', 'numberOfTickets', 'registrationDate', 'checkedIn']
        }
      ]
    });

    if (saludEvent) {
      const eventJson = saludEvent.toJSON();
      console.log(`\n📊 "Taller de salud Física" now has ${eventJson.registrations.length} registrations:`);
      if (eventJson.registrations.length > 0) {
        eventJson.registrations.forEach((reg, index) => {
          console.log(`   ${index + 1}. ${reg.attendeeName} (${reg.attendeeEmail}) - ${reg.numberOfTickets} ticket(s) - ${reg.checkedIn ? 'Checked In' : 'Pending'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error during production sync:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run the sync if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncProductionBookings();
}

export default syncProductionBookings;
