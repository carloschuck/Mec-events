import axios from 'axios';
import { Event, Registration } from '../models/index.js';

class MECService {
  constructor() {
    this.baseURL = process.env.MEC_API_URL;
    this.apiKey = process.env.MEC_API_KEY;
    this.axiosInstance = axios.create({
      baseURL: `${this.baseURL.replace(/\/$/, '')}/wp-json/mec/v1.0`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add MEC API token header if provided
    if (this.apiKey) {
      this.axiosInstance.defaults.headers.common['mec-token'] = this.apiKey;
    }

    // Add basic auth if credentials provided
    if (process.env.MEC_API_AUTH_USER && process.env.MEC_API_AUTH_PASS) {
      this.axiosInstance.defaults.auth = {
        username: process.env.MEC_API_AUTH_USER,
        password: process.env.MEC_API_AUTH_PASS
      };
    }
  }

  async testConnection() {
    try {
      const response = await this.axiosInstance.get('/events');
      console.log('✅ MEC API connection successful');
      return { 
        success: true, 
        data: {
          apiUrl: this.baseURL,
          namespace: 'mec/v1.0',
          eventsCount: response.data?.events ? Object.keys(response.data.events).length : 0,
          hasApiKey: !!this.apiKey
        }
      };
    } catch (error) {
      console.error('❌ MEC API connection failed:', error.message);
      return { success: false, error: error.message, response: error.response?.data };
    }
  }

  async fetchEvents() {
    try {
      const response = await this.axiosInstance.get('/events');
      console.log('📥 MEC API response:', JSON.stringify(response.data, null, 2));
      
      // MEC API returns events grouped by date, we need to flatten them
      const eventsData = response.data;
      if (eventsData && eventsData.events) {
        const allEvents = [];
        Object.keys(eventsData.events).forEach(date => {
          const eventsForDate = eventsData.events[date];
          if (Array.isArray(eventsForDate)) {
            eventsForDate.forEach(event => {
              allEvents.push({
                ...event,
                date: date // Add the date for reference
              });
            });
          }
        });
        return allEvents;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching events from MEC:', error.message);
      console.error('Error details:', error.response?.data);
      throw new Error('Failed to fetch events from MEC API');
    }
  }

  async fetchBookings() {
    try {
      const response = await this.axiosInstance.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings from MEC:', error.message);
      throw new Error('Failed to fetch bookings from MEC API');
    }
  }

  async syncEvents(sourceUrl = null) {
    try {
      // Determine source URL - use provided URL or extract from base URL
      const site_url = sourceUrl || this.baseURL || 'unknown';
      
      console.log(`🔄 Syncing events from MEC (${site_url})...`);
      console.log(`🔍 MEC API URL: ${this.baseURL}`);
      console.log(`🔍 API Key configured: ${!!this.apiKey}`);
      const mecEvents = await this.fetchEvents();

      if (!mecEvents || !Array.isArray(mecEvents)) {
        console.log('No events found or invalid response');
        console.log('🔍 mecEvents type:', typeof mecEvents);
        console.log('🔍 mecEvents value:', mecEvents);
        return { synced: 0, errors: 0 };
      }

      console.log(`🔍 Found ${mecEvents.length} events to sync`);

      let synced = 0;
      let errors = 0;

      for (const mecEvent of mecEvents) {
        try {
          // Extract event data from MEC API format
          const eventId = mecEvent.ID || mecEvent.id;
          const eventData = mecEvent.data || mecEvent;
          const eventDate = mecEvent.date; // This is the date key from the events object
          
          // Parse dates from timestamps
          const startDate = eventData.time?.start_timestamp ? new Date(eventData.time.start_timestamp * 1000) : null;
          const endDate = eventData.time?.end_timestamp ? new Date(eventData.time.end_timestamp * 1000) : null;
          
          const eventRecord = {
            mecEventId: String(eventId),
            sourceUrl: site_url,
            title: eventData.title || eventData.post?.post_title || 'Untitled Event',
            description: eventData.content || eventData.post?.post_content || '',
            startDate: startDate,
            endDate: endDate,
            location: eventData.meta?.mec_location_id ? `Location ID: ${eventData.meta.mec_location_id}` : '',
            address: '',
            capacity: parseInt(eventData.mec?.total_capacity || eventData.mec?.capacity || 0),
            imageUrl: eventData.featured_image || eventData.thumbnails?.full || '',
            status: this.determineEventStatus(eventData, startDate, endDate),
            metadata: mecEvent,
            lastSyncedAt: new Date()
          };

          await Event.upsert(eventRecord, {
            conflictFields: ['sourceUrl', 'mecEventId']
          });

          console.log(`✅ Synced event: ${eventRecord.title} (ID: ${eventId})`);
          synced++;
        } catch (error) {
          console.error(`Error syncing event ${mecEvent.ID || mecEvent.id}:`, error.message);
          errors++;
        }
      }

      console.log(`✅ Synced ${synced} events from ${site_url}, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      console.error('Error in syncEvents:', error.message);
      throw error;
    }
  }

  async syncBookings(sourceUrl = null) {
    try {
      // Determine source URL - use provided URL or extract from base URL
      const site_url = sourceUrl || this.baseURL || 'unknown';
      
      console.log(`🔄 Syncing bookings from MEC (${site_url})...`);
      const mecBookings = await this.fetchBookings();

      if (!mecBookings || !Array.isArray(mecBookings)) {
        console.log('No bookings found or invalid response');
        return { synced: 0, errors: 0 };
      }

      let synced = 0;
      let errors = 0;

      for (const booking of mecBookings) {
        try {
          // Find the corresponding event in our database from the same source
          const event = await Event.findOne({
            where: { 
              mecEventId: String(booking.event_id),
              sourceUrl: site_url
            }
          });

          if (!event) {
            console.log(`Event not found for booking ${booking.id} from ${site_url}`);
            errors++;
            continue;
          }

          const registrationData = {
            mecBookingId: String(booking.id),
            sourceUrl: site_url,
            eventId: event.id,
            attendeeName: booking.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
            attendeeEmail: booking.email,
            attendeePhone: booking.phone || '',
            numberOfTickets: parseInt(booking.tickets || booking.count || 1),
            registrationDate: new Date(booking.date || booking.created_at),
            metadata: booking
          };

          await Registration.upsert(registrationData, {
            conflictFields: ['sourceUrl', 'mecBookingId']
          });

          synced++;
        } catch (error) {
          console.error(`Error syncing booking ${booking.id}:`, error.message);
          errors++;
        }
      }

      console.log(`✅ Synced ${synced} bookings from ${site_url}, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      console.error('Error in syncBookings:', error.message);
      throw error;
    }
  }

  async syncAll(sourceUrl = null) {
    try {
      const eventsResult = await this.syncEvents(sourceUrl);
      const bookingsResult = await this.syncBookings(sourceUrl);

      return {
        events: eventsResult,
        bookings: bookingsResult,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in syncAll:', error.message);
      throw error;
    }
  }

  determineEventStatus(mecEvent, startDate, endDate) {
    const now = new Date();

    if (mecEvent.status === 'cancelled') {
      return 'cancelled';
    }

    if (endDate && now > endDate) {
      return 'completed';
    }

    if (startDate && now >= startDate && (!endDate || now <= endDate)) {
      return 'ongoing';
    }

    return 'upcoming';
  }
}

export default new MECService();

