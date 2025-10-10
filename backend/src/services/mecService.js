import axios from 'axios';
import { Event, Registration } from '../models/index.js';

class MECService {
  constructor() {
    this.baseURL = process.env.MEC_API_URL;
    this.apiKey = process.env.MEC_API_KEY;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add API key to headers if provided
    if (this.apiKey) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
      // Also try X-API-Key header as fallback
      this.axiosInstance.defaults.headers.common['X-API-Key'] = this.apiKey;
    }

    // Add basic auth if credentials provided
    if (process.env.MEC_API_AUTH_USER && process.env.MEC_API_AUTH_PASS) {
      this.axiosInstance.defaults.auth = {
        username: process.env.MEC_API_AUTH_USER,
        password: process.env.MEC_API_AUTH_PASS
      };
    }

    // Add request interceptor to append api_key as query parameter
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.apiKey) {
        config.params = {
          ...config.params,
          api_key: this.apiKey
        };
      }
      return config;
    });
  }

  async testConnection() {
    try {
      const response = await this.axiosInstance.get('/');
      console.log('✅ MEC API connection successful');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ MEC API connection failed:', error.message);
      return { success: false, error: error.message, response: error.response?.data };
    }
  }

  async fetchEvents() {
    try {
      const response = await this.axiosInstance.get('/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events from MEC:', error.message);
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

  async syncEvents() {
    try {
      console.log('🔄 Syncing events from MEC...');
      const mecEvents = await this.fetchEvents();

      if (!mecEvents || !Array.isArray(mecEvents)) {
        console.log('No events found or invalid response');
        return { synced: 0, errors: 0 };
      }

      let synced = 0;
      let errors = 0;

      for (const mecEvent of mecEvents) {
        try {
          const eventData = {
            mecEventId: String(mecEvent.id),
            title: mecEvent.title || mecEvent.name || 'Untitled Event',
            description: mecEvent.description || mecEvent.content || '',
            startDate: new Date(mecEvent.start || mecEvent.start_date),
            endDate: mecEvent.end || mecEvent.end_date ? new Date(mecEvent.end || mecEvent.end_date) : null,
            location: mecEvent.location?.name || mecEvent.venue || '',
            address: mecEvent.location?.address || '',
            capacity: parseInt(mecEvent.capacity || mecEvent.spots || 0),
            imageUrl: mecEvent.image || mecEvent.featured_image || '',
            status: this.determineEventStatus(mecEvent),
            metadata: mecEvent,
            lastSyncedAt: new Date()
          };

          await Event.upsert(eventData, {
            conflictFields: ['mecEventId']
          });

          synced++;
        } catch (error) {
          console.error(`Error syncing event ${mecEvent.id}:`, error.message);
          errors++;
        }
      }

      console.log(`✅ Synced ${synced} events, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      console.error('Error in syncEvents:', error.message);
      throw error;
    }
  }

  async syncBookings() {
    try {
      console.log('🔄 Syncing bookings from MEC...');
      const mecBookings = await this.fetchBookings();

      if (!mecBookings || !Array.isArray(mecBookings)) {
        console.log('No bookings found or invalid response');
        return { synced: 0, errors: 0 };
      }

      let synced = 0;
      let errors = 0;

      for (const booking of mecBookings) {
        try {
          // Find the corresponding event in our database
          const event = await Event.findOne({
            where: { mecEventId: String(booking.event_id) }
          });

          if (!event) {
            console.log(`Event not found for booking ${booking.id}`);
            errors++;
            continue;
          }

          const registrationData = {
            mecBookingId: String(booking.id),
            eventId: event.id,
            attendeeName: booking.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
            attendeeEmail: booking.email,
            attendeePhone: booking.phone || '',
            numberOfTickets: parseInt(booking.tickets || booking.count || 1),
            registrationDate: new Date(booking.date || booking.created_at),
            metadata: booking
          };

          await Registration.upsert(registrationData, {
            conflictFields: ['mecBookingId']
          });

          synced++;
        } catch (error) {
          console.error(`Error syncing booking ${booking.id}:`, error.message);
          errors++;
        }
      }

      console.log(`✅ Synced ${synced} bookings, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      console.error('Error in syncBookings:', error.message);
      throw error;
    }
  }

  async syncAll() {
    try {
      const eventsResult = await this.syncEvents();
      const bookingsResult = await this.syncBookings();

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

  determineEventStatus(mecEvent) {
    const now = new Date();
    const startDate = new Date(mecEvent.start || mecEvent.start_date);
    const endDate = mecEvent.end || mecEvent.end_date ? new Date(mecEvent.end || mecEvent.end_date) : null;

    if (mecEvent.status === 'cancelled') {
      return 'cancelled';
    }

    if (endDate && now > endDate) {
      return 'completed';
    }

    if (now >= startDate && (!endDate || now <= endDate)) {
      return 'ongoing';
    }

    return 'upcoming';
  }
}

export default new MECService();

