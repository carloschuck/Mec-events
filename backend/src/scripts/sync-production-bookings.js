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

        const attendeesInfo = booking.attendees_info || [];
        let processed = 0;

        if (attendeesInfo.length > 0) {
          for (let i = 0; i < attendeesInfo.length; i++) {
            const attendee = attendeesInfo[i];
            const attendeeName = attendee.name || `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() || 'Unknown';
            const attendeeEmail = attendee.email || booking.email || '';

            if (!attendeeEmail || !attendeeEmail.includes('@')) {
              console.log(`⚠️  Skipping attendee ${i + 1} for booking ${booking.id} - invalid email: "${attendeeEmail}"`);
              errors++;
              continue;
            }

            const registrationData = {
              mecBookingId: String(booking.id),
              sourceUrl: baseURL,
              eventId: event.id,
              attendeeName,
              attendeeEmail,
              attendeePhone: attendee.tel || attendee.phone || booking.phone || '',
              numberOfTickets: 1,
              attendeeIndex: i,
              registrationDate: booking.date ? new Date(booking.date) : new Date(),
              metadata: {
                ...booking,
                attendeeIndex: i,
                totalAttendees: attendeesInfo.length
              }
            };

            await Registration.upsert(registrationData, {
              conflictFields: ['sourceUrl', 'mecBookingId', 'attendeeIndex']
            });

            processed++;
          }
        } else {
          const attendeeName = booking.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Unknown';
          const attendeeEmail = booking.email || '';

          if (!attendeeEmail || !attendeeEmail.includes('@')) {
            console.log(`⚠️  Skipping booking ${booking.id} - invalid email: "${attendeeEmail}"`);
            errors++;
            continue;
          }

          const ticketCount = Math.max(parseInt(booking.tickets || booking.count || booking.seats || 1, 10), 1);
          for (let i = 0; i < ticketCount; i++) {
            const registrationData = {
              mecBookingId: String(booking.id),
              sourceUrl: baseURL,
              eventId: event.id,
              attendeeName: ticketCount > 1 ? `${attendeeName} (Seat ${i + 1})` : attendeeName,
              attendeeEmail,
              attendeePhone: booking.phone || '',
              numberOfTickets: 1,
              attendeeIndex: i,
              registrationDate: booking.date ? new Date(booking.date) : new Date(),
              metadata: {
                ...booking,
                attendeeIndex: i,
                totalAttendees: ticketCount
              }
            };

            await Registration.upsert(registrationData, {
              conflictFields: ['sourceUrl', 'mecBookingId', 'attendeeIndex']
            });

            processed++;
          }
        }

        if (processed === 0) {
          skipped++;
        } else {
          synced += processed;
          console.log(`✅ Synced booking ${booking.id}: ${processed} attendee(s) for event: ${event.title}`);
        }
        
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
