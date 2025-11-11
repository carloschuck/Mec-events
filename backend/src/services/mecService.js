import axios from 'axios';
import { Event, Registration } from '../models/index.js';
import { normalizeSourceUrl, sanitizeMecApiBaseUrl } from '../utils/url.js';

class MECService {
  constructor() {
    this.rawBaseURL = process.env.MEC_API_URL;
    this.baseURL = sanitizeMecApiBaseUrl(this.rawBaseURL);
    this.apiKey = process.env.MEC_API_KEY;
    
    // Only create axios instance if baseURL is available
    if (this.baseURL) {
      this.axiosInstance = axios.create({
        baseURL: `${this.baseURL}/wp-json/wp/v2`,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      this.axiosInstance = null;
    }

    // Add MEC API token header if provided (for MEC-specific endpoints)
    if (this.apiKey && this.axiosInstance) {
      this.axiosInstance.defaults.headers.common['mec-token'] = this.apiKey;
    }

    // Add basic auth if credentials provided
    if (process.env.MEC_API_AUTH_USER && process.env.MEC_API_AUTH_PASS && this.axiosInstance) {
      this.axiosInstance.defaults.auth = {
        username: process.env.MEC_API_AUTH_USER,
        password: process.env.MEC_API_AUTH_PASS
      };
    }
  }

  async testConnection() {
    try {
      if (!this.axiosInstance) {
        throw new Error('MEC API URL not configured');
      }
      
      const response = await this.axiosInstance.get('/mec-events?per_page=1');
      console.log('✅ WordPress REST API connection successful');
      return { 
        success: true, 
        data: {
          apiUrl: this.baseURL,
          namespace: 'wp/v2',
          eventsCount: Array.isArray(response.data) ? response.data.length : 0,
          hasApiKey: !!this.apiKey
        }
      };
    } catch (error) {
      console.error('❌ WordPress REST API connection failed:', error.message);
      return { success: false, error: error.message, response: error.response?.data };
    }
  }

  async fetchEvents() {
    try {
      // Order by modified date (descending) to get most recently updated events
      // Only fetch published events
      const response = await this.axiosInstance.get('/mec-events?per_page=100&orderby=modified&order=desc&status=publish');
      console.log('📥 WordPress REST API response:', JSON.stringify(response.data, null, 2));
      
      // WordPress REST API returns events as an array
      const eventsData = response.data;
      if (Array.isArray(eventsData)) {
        return eventsData.map(event => ({
          ...event,
          // Transform WordPress event format to match our expected format
          ID: event.id,
          data: {
            title: event.title?.rendered || event.title,
            content: event.content?.rendered || event.content,
            post: {
              post_title: event.title?.rendered || event.title,
              post_content: event.content?.rendered || event.content,
              post_date: event.date,
              post_modified: event.modified
            },
            meta: event.meta || {},
            mec: event.mec || {},
            time: event.time || {},
            featured_image: event.featured_media,
            thumbnails: event.thumbnails || {}
          }
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching events from WordPress REST API:', error.message);
      console.error('Error details:', error.response?.data);
      throw new Error('Failed to fetch events from WordPress REST API');
    }
  }

  async fetchBookings() {
    try {
      // Use MEC Bridge API endpoint instead of WordPress REST API
      const mecApiUrl = this.baseURL;
      
      if (!mecApiUrl) {
        throw new Error('MEC API URL not configured');
      }

      console.log(`🔄 Fetching bookings from MEC Bridge API: ${mecApiUrl}/wp-json/mec-bridge/v1/bookings`);
      
      // Fetch all bookings with pagination
      let allBookings = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`${mecApiUrl}/wp-json/mec-bridge/v1/bookings?per_page=100&page=${page}`, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MEC-Events-App/1.0'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ MEC Bridge API error: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`MEC Bridge API error: ${response.status} ${response.statusText}`);
        }
        
        const bookings = await response.json();
        
        if (bookings.length === 0) {
          hasMore = false;
        } else {
          allBookings = allBookings.concat(bookings);
          page++;
          if (page > 60) { // Safety limit for 6000 bookings
            hasMore = false;
          }
          if (bookings.length < 100) { // Early termination
            hasMore = false;
          }
        }
      }
      
      console.log(`✅ Fetched ${allBookings.length} bookings from MEC Bridge API`);
      return allBookings;
    } catch (error) {
      console.error('Error fetching bookings from MEC Bridge API:', error.message);
      throw new Error('Failed to fetch bookings from MEC Bridge API');
    }
  }

  async syncEvents(sourceUrl = null) {
    try {
      // Determine source URL - use provided URL or extract from base URL
      const site_url = normalizeSourceUrl(sourceUrl) || this.baseURL || 'unknown';
      
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
          
          // Extract dates from MEC metadata
          let startDate = null;
          let endDate = null;
          
          // Try to get dates from mec_start_datetime and mec_end_datetime first
          if (eventData.meta?.mec_start_datetime) {
            startDate = new Date(eventData.meta.mec_start_datetime);
          } else if (eventData.meta?.mec_start_date) {
            const startDateStr = eventData.meta.mec_start_date;
            const startTime = eventData.meta?.mec_start_time_hour 
              ? `${eventData.meta.mec_start_time_hour}:${eventData.meta.mec_start_time_minutes || '00'} ${eventData.meta.mec_start_time_ampm || 'AM'}`
              : '00:00';
            startDate = new Date(`${startDateStr} ${startTime}`);
          } else if (eventData.time?.start_timestamp) {
            // Fallback to timestamp if available
            startDate = new Date(eventData.time.start_timestamp * 1000);
          }
          
          if (eventData.meta?.mec_end_datetime) {
            endDate = new Date(eventData.meta.mec_end_datetime);
          } else if (eventData.meta?.mec_end_date) {
            const endDateStr = eventData.meta.mec_end_date;
            const endTime = eventData.meta?.mec_end_time_hour 
              ? `${eventData.meta.mec_end_time_hour}:${eventData.meta.mec_end_time_minutes || '00'} ${eventData.meta.mec_end_time_ampm || 'PM'}`
              : '23:59';
            endDate = new Date(`${endDateStr} ${endTime}`);
          } else if (eventData.time?.end_timestamp) {
            endDate = new Date(eventData.time.end_timestamp * 1000);
          }
          
          // Skip past events
          const now = new Date();
          if (endDate && endDate < now) {
            console.log(`⏭️  Skipping past event: ${eventData.title || eventData.post?.post_title} (ended ${endDate.toLocaleDateString()})`);
            continue;
          }

          // If we don't have a valid start date, skip this event
          if (!startDate || isNaN(startDate.getTime())) {
            console.log(`⚠️  Skipping event with invalid date: ${eventData.title || eventData.post?.post_title}`);
            errors++;
            continue;
          }
          
          const eventRecord = {
            mecEventId: String(eventId),
            sourceUrl: site_url,
            title: eventData.title || eventData.post?.post_title || 'Untitled Event',
            description: eventData.content || eventData.post?.post_content || '',
            startDate: startDate,
            endDate: endDate,
            location: eventData.meta?.mec_location_id ? `Location ID: ${eventData.meta.mec_location_id}` : '',
            address: eventData.meta?.mec_address || '',
            capacity: parseInt(eventData.meta?.mec_bookings_limit || eventData.mec?.total_capacity || eventData.mec?.capacity || 0),
            imageUrl: eventData.featured_image || eventData.thumbnails?.full || '',
            status: this.determineEventStatus(eventData, startDate, endDate),
            metadata: mecEvent,
            lastSyncedAt: new Date()
          };

          await Event.upsert(eventRecord, {
            conflictFields: ['sourceUrl', 'mecEventId']
          });

          console.log(`✅ Synced event: ${eventRecord.title} (${eventRecord.status}, starts ${startDate.toLocaleDateString()})`);
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

      console.log(`📝 Processing ${mecBookings.length} bookings...`);
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
            console.log(`⚠️  Event not found for booking ${booking.id} (Event ID: ${booking.event_id})`);
            errors++;
            continue;
          }

          // Process multiple attendees from attendees_info array
          const attendeesInfo = booking.attendees_info || [];
          let bookingSynced = 0;
          let bookingErrors = 0;

          if (attendeesInfo.length > 0) {
            // Process each attendee in the attendees_info array
            for (let i = 0; i < attendeesInfo.length; i++) {
              const attendee = attendeesInfo[i];
              
              // Parse attendee data
              const attendeeName = attendee.name || `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim();
              const attendeeEmail = attendee.email || '';
              
              // Skip attendees with invalid email
              if (!attendeeEmail || !attendeeEmail.includes('@')) {
                console.log(`⚠️  Skipping attendee ${i + 1} in booking ${booking.id} - invalid email: "${attendeeEmail}"`);
                bookingErrors++;
                continue;
              }

              const registrationData = {
                mecBookingId: String(booking.id),
                sourceUrl: site_url,
                eventId: event.id,
                attendeeName: attendeeName || 'Unknown',
                attendeeEmail: attendeeEmail,
                attendeePhone: attendee.tel || attendee.phone || '',
                numberOfTickets: 1, // Each attendee gets 1 ticket
                attendeeIndex: i,
                registrationDate: booking.date ? new Date(booking.date) : (booking.created_at ? new Date(booking.created_at) : new Date()),
                metadata: {
                  ...booking,
                  attendeeIndex: i,
                  totalAttendees: attendeesInfo.length
                }
              };

              // Upsert the registration with unique conflict fields
              await Registration.upsert(registrationData, {
                conflictFields: ['sourceUrl', 'mecBookingId', 'attendeeIndex']
              });

              bookingSynced++;
              console.log(`✅ Synced attendee ${i + 1}/${attendeesInfo.length} from booking ${booking.id}: ${attendeeName}`);
            }
          } else {
            // Fallback to single attendee (legacy booking format)
            const attendeeName = booking.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim();
            const attendeeEmail = booking.email || '';
            
            // Skip bookings with invalid email
            if (!attendeeEmail || !attendeeEmail.includes('@')) {
              console.log(`⚠️  Skipping booking ${booking.id} - invalid email: "${attendeeEmail}"`);
              bookingErrors++;
              continue;
            }

            const ticketCount = Math.max(parseInt(booking.tickets || booking.count || booking.seats || 1, 10), 1);
            for (let i = 0; i < ticketCount; i++) {
              const registrationData = {
                mecBookingId: String(booking.id),
                sourceUrl: site_url,
                eventId: event.id,
                attendeeName: ticketCount > 1 ? `${attendeeName || 'Unknown'} (Seat ${i + 1})` : (attendeeName || 'Unknown'),
                attendeeEmail: attendeeEmail,
                attendeePhone: booking.phone || '',
                numberOfTickets: 1,
                attendeeIndex: i,
                registrationDate: booking.date ? new Date(booking.date) : (booking.created_at ? new Date(booking.created_at) : new Date()),
                metadata: {
                  ...booking,
                  attendeeIndex: i,
                  totalAttendees: ticketCount
                }
              };

              await Registration.upsert(registrationData, {
                conflictFields: ['sourceUrl', 'mecBookingId', 'attendeeIndex']
              });

              bookingSynced++;
            }

            console.log(`✅ Synced ${ticketCount} attendee(s) from booking ${booking.id}: ${attendeeName}`);
          }

          synced += bookingSynced;
          errors += bookingErrors;
          
          if (bookingSynced > 0) {
            console.log(`✅ Booking ${booking.id} processed: ${bookingSynced} attendees synced, ${bookingErrors} errors`);
          }
        } catch (error) {
          console.error(`❌ Error syncing booking ${booking.id}:`, error.message);
          errors++;
        }
      }

      console.log(`✅ Booking sync completed: ${synced} synced, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      console.error('❌ Error in syncBookings:', error.message);
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

