import { Event, Registration } from '../models/index.js';
import crypto from 'crypto';

export const handleMecWebhook = async (req, res) => {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-mec-signature'];
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }
    }

    const { event_type, data, timestamp, site_url } = req.body;

    console.log(`\n📥 Received webhook: ${event_type}`);
    console.log(`   From: ${site_url}`);
    console.log(`   Time: ${timestamp}`);

    // Handle different event types
    switch (event_type) {
      case 'test.webhook':
        console.log('✅ Test webhook received successfully');
        return res.json({
          success: true,
          message: 'Test webhook received',
          received_at: new Date().toISOString()
        });

      case 'event.saved':
      case 'event.published':
        await handleEventWebhook(data, site_url);
        break;

      case 'event.deleted':
        await handleEventDeletion(data, site_url);
        break;

      case 'booking.completed':
      case 'booking.confirmed':
        await handleBookingWebhook(data, site_url);
        break;

      case 'booking.canceled':
        await handleBookingCancellation(data, site_url);
        break;

      case 'attendee.checked_in':
        await handleCheckin(data, site_url);
        break;

      default:
        console.log(`⚠️  Unknown event type: ${event_type}`);
    }

    res.json({
      success: true,
      message: 'Webhook processed',
      event_type
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

async function handleEventWebhook(data, site_url) {
  try {
    const { event_id, event_data } = data;
    
    if (!event_data) {
      console.log('⚠️  No event data provided');
      return;
    }

    const mec_data = event_data.mec_data || {};

    // Parse event data
    const eventRecord = {
      mecEventId: String(event_id),
      sourceUrl: site_url,
      title: event_data.title || 'Untitled Event',
      description: event_data.description || '',
      startDate: mec_data.start ? new Date(mec_data.start) : new Date(),
      endDate: mec_data.end ? new Date(mec_data.end) : null,
      location: mec_data.location?.name || mec_data.location || '',
      address: mec_data.location?.address || '',
      capacity: parseInt(mec_data.capacity || 0),
      imageUrl: mec_data.featured_image || '',
      status: determineEventStatus(mec_data, event_data.status),
      metadata: mec_data,
      lastSyncedAt: new Date()
    };

    await Event.upsert(eventRecord, {
      conflictFields: ['sourceUrl', 'mecEventId']
    });

    console.log(`✅ Event ${event_id} synced from ${site_url}: ${eventRecord.title}`);
  } catch (error) {
    console.error('Error handling event webhook:', error);
  }
}

async function handleEventDeletion(data, site_url) {
  try {
    const { event_id } = data;
    
    const deleted = await Event.destroy({
      where: { 
        mecEventId: String(event_id),
        sourceUrl: site_url
      }
    });

    if (deleted) {
      console.log(`✅ Event ${event_id} from ${site_url} deleted from database`);
    }
  } catch (error) {
    console.error('Error handling event deletion:', error);
  }
}

async function handleBookingWebhook(data, site_url) {
  try {
    const { booking_id, booking_data } = data;
    
    if (!booking_data) {
      console.log('⚠️  No booking data provided');
      return;
    }

    // Find the event from the same site
    const event = await Event.findOne({
      where: { 
        mecEventId: String(booking_data.event_id),
        sourceUrl: site_url
      }
    });

    if (!event) {
      console.log(`⚠️  Event not found for booking ${booking_id} from ${site_url}`);
      return;
    }

    // Parse booking data
    const registrationRecord = {
      mecBookingId: String(booking_id),
      sourceUrl: site_url,
      eventId: event.id,
      attendeeName: booking_data.name || `${booking_data.first_name || ''} ${booking_data.last_name || ''}`.trim(),
      attendeeEmail: booking_data.email || '',
      attendeePhone: booking_data.phone || '',
      numberOfTickets: parseInt(booking_data.tickets || booking_data.count || 1),
      registrationDate: booking_data.date ? new Date(booking_data.date) : new Date(),
      metadata: booking_data
    };

    await Registration.upsert(registrationRecord, {
      conflictFields: ['sourceUrl', 'mecBookingId']
    });

    console.log(`✅ Booking ${booking_id} synced from ${site_url} for event: ${event.title}`);
  } catch (error) {
    console.error('Error handling booking webhook:', error);
  }
}

async function handleBookingCancellation(data, site_url) {
  try {
    const { booking_id } = data;
    
    const deleted = await Registration.destroy({
      where: { 
        mecBookingId: String(booking_id),
        sourceUrl: site_url
      }
    });

    if (deleted) {
      console.log(`✅ Booking ${booking_id} from ${site_url} removed from database`);
    }
  } catch (error) {
    console.error('Error handling booking cancellation:', error);
  }
}

async function handleCheckin(data, site_url) {
  try {
    const { booking_id } = data;
    
    const registration = await Registration.findOne({
      where: { 
        mecBookingId: String(booking_id),
        sourceUrl: site_url
      }
    });

    if (registration) {
      await registration.update({
        checkedIn: true,
        checkedInAt: new Date()
      });
      console.log(`✅ Attendee checked in from ${site_url}: ${registration.attendeeName}`);
    }
  } catch (error) {
    console.error('Error handling checkin:', error);
  }
}

function determineEventStatus(mec_data, post_status) {
  if (post_status !== 'publish') {
    return 'cancelled';
  }

  const now = new Date();
  const startDate = mec_data.start ? new Date(mec_data.start) : null;
  const endDate = mec_data.end ? new Date(mec_data.end) : null;

  if (!startDate) return 'upcoming';

  if (endDate && now > endDate) {
    return 'completed';
  }

  if (now >= startDate && (!endDate || now <= endDate)) {
    return 'ongoing';
  }

  return 'upcoming';
}

