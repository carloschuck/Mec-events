import { Event, Registration } from '../models/index.js';
import { Op } from 'sequelize';
import { normalizeSourceUrl, sanitizeMecApiBaseUrl } from '../utils/url.js';

const getSanitizedMecApiUrl = () => sanitizeMecApiBaseUrl(process.env.MEC_API_URL);

/**
 * MEC REST API Integration Controller
 * Based on Modern Events Calendar REST API v1.0
 * 
 * Authentication:
 * - API Token: Required in 'mec-token' header
 * - User Token: Optional in 'mec-user' header for authenticated requests
 * 
 * Endpoints:
 * - GET /mec/v1.0/events - List events
 * - GET /mec/v1.0/events/{id} - Get single event
 * - POST /mec/v1.0/login - User authentication
 * - GET /mec/v1.0/events/{id}/tickets - Get event tickets
 * - GET /mec/v1.0/events/{id}/fees - Get event fees
 */

export const getEvents = async (req, res) => {
  try {
    const { 
      limit = 12, 
      offset = 0, 
      start_date, 
      end_date,
      start_date_type = 'today',
      end_date_type = 'date',
      order = 'ASC',
      keyword,
      categories,
      locations,
      organizers,
      labels,
      tags
    } = req.query;
    
    // Build query parameters
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      start_date_type,
      end_date_type,
      order
    });
    
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (keyword) params.append('keyword', keyword);
    if (categories) params.append('categories', categories);
    if (locations) params.append('locations', locations);
    if (organizers) params.append('organizers', organizers);
    if (labels) params.append('labels', labels);
    if (tags) params.append('tags', tags);
    
    const mecApiUrl = getSanitizedMecApiUrl();
    if (!mecApiUrl) {
      return res.status(400).json({
        success: false,
        message: 'MEC API URL not configured'
      });
    }
    
    const apiKey = process.env.MEC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'MEC API Key not configured'
      });
    }
    
    console.log(`🔍 Fetching events from MEC API: ${mecApiUrl}/wp-json/mec/v1.0/events`);
    
    const response = await fetch(`${mecApiUrl}/wp-json/mec/v1.0/events?${params}`, {
      headers: {
        'mec-token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'MEC-Events-App/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MEC API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`MEC API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.data?.events?.length || 0} events from MEC API`);
    
    res.json({
      success: true,
      data: data.data || data
    });
    
  } catch (error) {
    console.error('❌ Error fetching events from MEC API:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events from MEC API',
      error: error.message
    });
  }
};

export const getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mecApiUrl = getSanitizedMecApiUrl();
    const apiKey = process.env.MEC_API_KEY;
    
    if (!mecApiUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured'
      });
    }
    
    console.log(`🔍 Fetching event ${id} from MEC API`);
    
    const response = await fetch(`${mecApiUrl}/wp-json/mec/v1.0/events/${id}`, {
      headers: {
        'mec-token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'MEC-Events-App/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MEC API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`MEC API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched event ${id} from MEC API`);
    
    res.json({
      success: true,
      data: data.data || data
    });
    
  } catch (error) {
    console.error('❌ Error fetching event from MEC API:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event from MEC API',
      error: error.message
    });
  }
};

export const getEventTickets = async (req, res) => {
  try {
    const { id } = req.params;
    const { occurrence } = req.query;
    
    const mecApiUrl = getSanitizedMecApiUrl();
    const apiKey = process.env.MEC_API_KEY;
    
    if (!mecApiUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured'
      });
    }
    
    const params = new URLSearchParams();
    if (occurrence) params.append('occurrence', occurrence);
    
    const url = `${mecApiUrl}/wp-json/mec/v1.0/events/${id}/tickets${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log(`🔍 Fetching tickets for event ${id} from MEC API`);
    
    const response = await fetch(url, {
      headers: {
        'mec-token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'MEC-Events-App/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MEC API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`MEC API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched tickets for event ${id} from MEC API`);
    
    res.json({
      success: true,
      data: data.data || data
    });
    
  } catch (error) {
    console.error('❌ Error fetching event tickets from MEC API:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event tickets from MEC API',
      error: error.message
    });
  }
};

export const getEventFees = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mecApiUrl = getSanitizedMecApiUrl();
    const apiKey = process.env.MEC_API_KEY;
    
    if (!mecApiUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured'
      });
    }
    
    console.log(`🔍 Fetching fees for event ${id} from MEC API`);
    
    const response = await fetch(`${mecApiUrl}/wp-json/mec/v1.0/events/${id}/fees`, {
      headers: {
        'mec-token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'MEC-Events-App/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MEC API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`MEC API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully fetched fees for event ${id} from MEC API`);
    
    res.json({
      success: true,
      data: data.data || data
    });
    
  } catch (error) {
    console.error('❌ Error fetching event fees from MEC API:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event fees from MEC API',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    const mecApiUrl = getSanitizedMecApiUrl();
    const apiKey = process.env.MEC_API_KEY;
    
    if (!mecApiUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured'
      });
    }
    
    console.log(`🔍 Authenticating user ${username} with MEC API`);
    
    const response = await fetch(`${mecApiUrl}/wp-json/mec/v1.0/login`, {
      method: 'POST',
      headers: {
        'mec-token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'MEC-Events-App/1.0'
      },
      body: JSON.stringify({
        username,
        password
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MEC API login error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`MEC API login error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully authenticated user ${username} with MEC API`);
    
    res.json({
      success: true,
      data: data.data || data
    });
    
  } catch (error) {
    console.error('❌ Error authenticating with MEC API:', error);
    res.status(500).json({
      success: false,
      message: 'Error authenticating with MEC API',
      error: error.message
    });
  }
};

export const syncEvents = async (req, res) => {
  try {
    const mecApiUrl = getSanitizedMecApiUrl();
    const apiKey = process.env.MEC_API_KEY;
    
    if (!mecApiUrl) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured. Please set MEC_API_URL environment variable.'
      });
    }

    console.log('🔄 Starting MEC Bridge API events sync...');
    
    // Fetch ALL events with pagination (no date filter) to ensure we have all events that bookings reference
    console.log(`📅 Fetching all events with pagination (no date filter)`);
    
    let allEvents = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const params = new URLSearchParams({
        per_page: '100',
        page: String(page)
      });
      
      const response = await fetch(`${mecApiUrl}/wp-json/mec-bridge/v1/events?${params}`, {
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
      
      const events = await response.json();
      
      if (!Array.isArray(events)) {
        console.log('⚠️  API response is not an array:', typeof events);
        throw new Error('Invalid API response format');
      }
      
      console.log(`📥 Fetched page ${page}: ${events.length} events`);
      
      if (events.length === 0) {
        hasMore = false;
      } else {
        allEvents = allEvents.concat(events);
        page++;
        // Safety limit - stop after 20 pages (2000 events)
        if (page > 20) {
          console.log(`⚠️  Reached page limit (20 pages)`);
          hasMore = false;
        }
        // Check if we got less than 100 events, meaning we've reached the end
        if (events.length < 100) {
          console.log(`✅ Reached last page (got ${events.length} events)`);
          hasMore = false;
        }
      }
    }
    
    const events = allEvents;
    console.log(`📥 Total fetched: ${events.length} events from ${page - 1} pages`);
    
    let syncedCount = 0;
    let errorCount = 0;
    
    // Sync each event to our database
    for (const event of events) {
      try {
        const eventId = event.id;
        
        // Extract dates from timestamps
        let startDate = null;
        let endDate = null;
        
        if (event.time?.start_timestamp) {
          startDate = new Date(event.time.start_timestamp * 1000);
        }
        
        if (event.time?.end_timestamp) {
          endDate = new Date(event.time.end_timestamp * 1000);
        }

        // If we don't have a valid start date, skip this event
        if (!startDate || isNaN(startDate.getTime())) {
          console.log(`⚠️  Skipping event with invalid date: ${event.title}`);
          errorCount++;
          continue;
        }

        // Determine event status based on dates
        const now = new Date();
        let status = 'upcoming';
        if (endDate && now > endDate) {
          status = 'completed';
        } else if (startDate && now >= startDate && (!endDate || now <= endDate)) {
          status = 'ongoing';
        }

        const eventRecord = {
          mecEventId: String(eventId),
          sourceUrl: mecApiUrl,
          title: event.title || 'Untitled Event',
          description: event.content || '',
          startDate: startDate,
          endDate: endDate,
          location: event.meta?.mec_location_id ? `Location ID: ${event.meta.mec_location_id}` : '',
          address: event.meta?.mec_address || '',
          capacity: parseInt(event.meta?.mec_bookings_limit || 0),
          imageUrl: event.featured_image || '',
          status: status,
          metadata: event,
          lastSyncedAt: new Date()
        };
        
        await Event.upsert(eventRecord, {
          conflictFields: ['sourceUrl', 'mecEventId']
        });
        
        syncedCount++;
        console.log(`✅ Synced event: ${eventRecord.title} (${status}, starts ${startDate.toLocaleDateString()})`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error syncing event ${event.id}:`, error.message);
      }
    }
    
    console.log(`🎉 Sync completed: ${syncedCount} events synced, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: 'Events sync completed',
      data: {
        total: events.length,
        synced: syncedCount,
        errors: errorCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error syncing events from MEC API:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing events from MEC API',
      error: error.message
    });
  }
};

/**
 * Test MEC API connection
 */
export const testConnection = async (req, res) => {
  try {
    const mecApiUrl = getSanitizedMecApiUrl();
    const apiKey = process.env.MEC_API_KEY;
    
    if (!mecApiUrl) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured. Please set MEC_API_URL environment variable.'
      });
    }
    
    console.log(`🔍 Testing MEC API connection to: ${mecApiUrl}`);
    
    const response = await fetch(`${mecApiUrl}/wp-json/mec/v1.0/events?limit=1`, {
      headers: {
        'mec-token': apiKey || '',
        'Content-Type': 'application/json',
        'User-Agent': 'MEC-Events-App/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MEC API connection failed: ${response.status} ${response.statusText}`, errorText);
      return res.status(400).json({
        success: false,
        message: 'MEC API connection failed',
        error: `${response.status} ${response.statusText}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log(`✅ MEC API connection successful`);
    
    res.json({
      success: true,
      message: 'MEC API connection successful',
      data: {
        apiUrl: mecApiUrl,
        namespace: 'mec/v1.0',
        eventsCount: data.data?.events?.length || 0,
        hasApiKey: !!apiKey
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing MEC API connection:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing MEC API connection',
      error: error.message
    });
  }
};

/**
 * Get MEC API configuration info
 */
export const getConfig = async (req, res) => {
  try {
    const config = {
      baseURL: getSanitizedMecApiUrl() || 'Not configured',
      hasApiKey: !!process.env.MEC_API_KEY,
      namespace: 'mec/v1.0',
      endpoints: {
        events: '/wp-json/mec/v1.0/events',
        event: '/wp-json/mec/v1.0/events/{id}',
        login: '/wp-json/mec/v1.0/login',
        tickets: '/wp-json/mec/v1.0/events/{id}/tickets',
        fees: '/wp-json/mec/v1.0/events/{id}/fees',
        customFields: '/wp-json/mec/v1.0/config/custom-fields',
        attendeeFields: '/wp-json/mec/v1.0/config/attendee-fields',
        fixedFields: '/wp-json/mec/v1.0/config/fixed-fields',
        ticketVariations: '/wp-json/mec/v1.0/config/ticket-variations',
        icons: '/wp-json/mec/v1.0/config/icons'
      },
      authentication: {
        method: 'API Token',
        header: 'mec-token',
        description: 'API token must be provided in the mec-token header for all requests'
      },
      features: {
        eventManagement: true,
        bookingSystem: true,
        ticketVariations: true,
        customFields: true,
        attendeeFields: true,
        weatherIntegration: true,
        relatedEvents: true
      }
    };

    res.json({
      success: true,
      message: 'MEC API configuration',
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting MEC configuration',
      error: error.message
    });
  }
};

/**
 * Clean up old events from the database
 * DELETE /api/mec-api/cleanup/old-events
 * Query params:
 *  - daysAgo: number of days ago to consider as old (default: 30)
 *  - dryRun: if true, only count events without deleting (default: false)
 */
export const cleanupOldEvents = async (req, res) => {
  try {
    const daysAgo = parseInt(req.query.daysAgo) || 30;
    const dryRun = req.query.dryRun === 'true';
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const { Event } = await import('../models/index.js');
    
    if (dryRun) {
      // Just count how many events would be deleted
      const count = await Event.count({
        where: {
          endDate: {
            [Op.lt]: cutoffDate
          }
        }
      });
      
      return res.json({
        success: true,
        message: `Would delete ${count} events older than ${daysAgo} days (before ${cutoffDate.toISOString()})`,
        data: {
          count,
          cutoffDate: cutoffDate.toISOString(),
          daysAgo,
          dryRun: true
        }
      });
    }
    
    // Actually delete the old events
    const deletedCount = await Event.destroy({
      where: {
        endDate: {
          [Op.lt]: cutoffDate
        }
      }
    });
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} events older than ${daysAgo} days`,
      data: {
        deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        daysAgo
      }
    });
  } catch (error) {
    console.error('Error cleaning up old events:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up old events',
      error: error.message
    });
  }
};

/**
 * Clean up duplicate events with trailing slash in sourceUrl
 * DELETE /api/mec-api/cleanup/sourceurl-duplicates
 */
export const cleanupSourceUrlDuplicates = async (req, res) => {
  try {
    const { Event } = await import('../models/index.js');
    
    const eventsWithTrailingSlash = await Event.findAll({
      where: {
        sourceUrl: {
          [Op.like]: '%/'
        }
      }
    });
    
    let updatedCount = 0;
    let deletedCount = 0;
    
    for (const event of eventsWithTrailingSlash) {
      const normalizedSource = normalizeSourceUrl(event.sourceUrl);
      
      if (!normalizedSource || normalizedSource === event.sourceUrl) {
        continue;
      }
      
      const existing = await Event.findOne({
        where: {
          mecEventId: event.mecEventId,
          sourceUrl: normalizedSource
        }
      });
      
      if (existing) {
        await event.destroy();
        deletedCount++;
      } else {
        await event.update({ sourceUrl: normalizedSource });
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Normalized sourceUrl for ${eventsWithTrailingSlash.length} events`,
      processed: eventsWithTrailingSlash.length,
      updatedCount,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cleaning up duplicates',
      error: error.message
    });
  }
};

/**
 * Debug endpoint to test syncing just one booking
 * POST /api/mec-api/debug/sync-one-booking
 */
export const debugSyncOneBooking = async (req, res) => {
  try {
    const { Event, Registration } = await import('../models/index.js');
    const mecApiUrl = getSanitizedMecApiUrl();
    const sourceUrl = mecApiUrl;
    
    // Fetch just 1 booking
    const response = await fetch(`${mecApiUrl}/wp-json/mec-bridge/v1/bookings?per_page=1`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MEC-Events-App/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const bookings = await response.json();
    const booking = bookings[0];
    
    // Try to find the event
    let event = await Event.findOne({
      where: {
        mecEventId: String(booking.event_id),
        sourceUrl
      }
    });
    
    if (!event) {
      event = await Event.findOne({
        where: {
          mecEventId: String(booking.event_id)
        }
      });
    }
    
    let registrationResult = null;
    if (event) {
      try {
        const registrationData = {
          mecBookingId: String(booking.id),
          sourceUrl,
          eventId: event.id,
          attendeeName: booking.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
          attendeeEmail: booking.email || '',
          attendeePhone: booking.phone || '',
          numberOfTickets: parseInt(booking.tickets || booking.count || 1),
          registrationDate: booking.date ? new Date(booking.date) : (booking.created_at ? new Date(booking.created_at) : new Date()),
          metadata: booking
        };
        
        const result = await Registration.upsert(registrationData, {
          conflictFields: ['sourceUrl', 'mecBookingId']
        });
        
        registrationResult = {
          success: true,
          data: registrationData,
          result: result
        };
      } catch (error) {
        registrationResult = {
          success: false,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      booking: {
        id: booking.id,
        event_id: booking.event_id,
        name: booking.name,
        email: booking.email
      },
      event: event ? {
        id: event.id,
        mecEventId: event.mecEventId,
        title: event.title,
        sourceUrl: event.sourceUrl
      } : null,
      sourceUrl,
      registrationResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Debug endpoint to test booking match for event 37332
 * GET /api/mec-api/debug/test-booking-match
 */
export const debugBookingMatch = async (req, res) => {
  try {
    const { Event } = await import('../models/index.js');
    const testEventId = "37332";
    const mecApiUrl = getSanitizedMecApiUrl();
    const sourceUrl = mecApiUrl;
    
    // Try to find the event exactly as the booking sync does
    const eventWithSourceUrl = await Event.findOne({
      where: {
        mecEventId: String(testEventId),
        sourceUrl
      }
    });
    
    const eventWithoutSourceUrl = await Event.findOne({
      where: {
        mecEventId: String(testEventId)
      }
    });
    
    res.json({
      success: true,
      testEventId,
      sourceUrl,
      eventWithSourceUrl: eventWithSourceUrl ? {
        id: eventWithSourceUrl.id,
        mecEventId: eventWithSourceUrl.mecEventId,
        sourceUrl: eventWithSourceUrl.sourceUrl,
        title: eventWithSourceUrl.title
      } : null,
      eventWithoutSourceUrl: eventWithoutSourceUrl ? {
        id: eventWithoutSourceUrl.id,
        mecEventId: eventWithoutSourceUrl.mecEventId,
        sourceUrl: eventWithoutSourceUrl.sourceUrl,
        title: eventWithoutSourceUrl.title
      } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Debug endpoint to check what event IDs we have in database
 * GET /api/mec-api/debug/event-ids
 */
export const debugEventIds = async (req, res) => {
  try {
    const { Event } = await import('../models/index.js');
    const events = await Event.findAll({
      attributes: ['id', 'mecEventId', 'title', 'sourceUrl'],
      limit: 20,
      order: [['mecEventId', 'DESC']]
    });
    
    res.json({
      success: true,
      total: await Event.count(),
      sample: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync bookings/registrations from MEC API
 * POST /api/mec-api/sync/bookings
 */
export const syncBookings = async (req, res) => {
  try {
    const mecApiUrl = getSanitizedMecApiUrl();
    
    if (!mecApiUrl) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured. Please set MEC_API_URL environment variable.'
      });
    }
    
    console.log('🔄 Starting MEC Bridge API bookings sync...');
    
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
    
    const bookings = allBookings;
    
    if (!Array.isArray(bookings)) {
      console.log('⚠️  API response is not an array:', typeof bookings);
      
      // Check if it's an error response
      if (bookings.error) {
        return res.json({
          success: true,
          message: bookings.error,
          data: { total: 0, synced: 0, errors: 0 }
        });
      }
      
      throw new Error('Invalid API response format');
    }
    
    console.log(`📥 Fetched ${bookings.length} bookings from MEC Bridge API`);
    
    let syncedCount = 0;
    let errorCount = 0;
    const sourceUrl = normalizeSourceUrl(mecApiUrl);
    
    // Import Registration model
    const { Registration } = await import('../models/index.js');
    
    // Sync each booking to our database
    for (const booking of bookings) {
      try {
        // Find the corresponding event in our database (try with and without sourceUrl match)
        let event = await Event.findOne({
          where: {
            mecEventId: String(booking.event_id),
            sourceUrl
          }
        });
        
        // Try without sourceUrl if not found (just match by mecEventId)
        if (!event) {
          event = await Event.findOne({
            where: {
              mecEventId: String(booking.event_id)
            }
          });
          if (event) {
            console.log(`✅ Found event ${booking.event_id} by mecEventId only (sourceUrl mismatch)`);
          }
        }
        
        if (!event) {
          // Log first 10 errors with full details to help debug
          if (errorCount < 10) {
            console.log(`⚠️  Event not found for booking ${booking.id} (MEC Event ID: "${booking.event_id}", type: ${typeof booking.event_id})`);
            console.log(`   Booking data:`, JSON.stringify(booking).substring(0, 200));
          }
          errorCount++;
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
              sourceUrl,
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
              sourceUrl,
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

            // Upsert the registration
            await Registration.upsert(registrationData, {
              conflictFields: ['sourceUrl', 'mecBookingId', 'attendeeIndex']
            });

            bookingSynced++;
          }

          console.log(`✅ Synced ${ticketCount} attendee(s) from booking ${booking.id}: ${attendeeName}`);
        }

        syncedCount += bookingSynced;
        errorCount += bookingErrors;
        
        if (bookingSynced > 0) {
          console.log(`✅ Booking ${booking.id} processed: ${bookingSynced} attendees synced, ${bookingErrors} errors`);
        }
      } catch (error) {
        console.error(`❌ Error syncing booking ${booking.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ Booking sync completed: ${syncedCount} synced, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: 'Bookings sync completed',
      data: {
        total: bookings.length,
        synced: syncedCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('❌ Error syncing bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing bookings',
      error: error.message
    });
  }
};

/**
 * Debug endpoint to analyze bookings for a specific event
 * GET /api/mec-api/debug/event-bookings/:eventId
 * Query params: ?title=... to search by title instead of ID
 */
export const debugEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title } = req.query;
    const mecApiUrl = getSanitizedMecApiUrl();
    const sourceUrl = mecApiUrl;

    // Find the event in our database
    let event;
    if (title) {
      // Search by title
      event = await Event.findOne({
        where: {
          title: { [Op.iLike]: `%${title}%` }
        }
      });
    } else {
      // Find by ID
      event = await Event.findByPk(eventId);
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: title ? `Event not found with title containing "${title}"` : 'Event not found in database'
      });
    }

    // Get all bookings from WordPress for this event
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
        throw new Error(`API error: ${response.status}`);
      }

      const bookings = await response.json();
      
      if (bookings.length === 0) {
        hasMore = false;
      } else {
        // Filter bookings for this specific event
        const eventBookings = bookings.filter(b => String(b.event_id) === String(event.mecEventId));
        allBookings = allBookings.concat(eventBookings);
        
        page++;
        if (page > 60 || bookings.length < 100) {
          hasMore = false;
        }
      }
    }

    // Count total attendees from WordPress
    let wordpressAttendeeCount = 0;
    const bookingDetails = [];

    for (const booking of allBookings) {
      const attendeesInfo = booking.attendees_info || [];
      let attendeeCount = 0;

      if (attendeesInfo.length > 0) {
        attendeeCount = attendeesInfo.filter(a => a.email && a.email.includes('@')).length;
      } else {
        const ticketCount = parseInt(booking.tickets || booking.count || 1);
        const hasValidEmail = booking.email && booking.email.includes('@');
        attendeeCount = hasValidEmail ? ticketCount : 0;
      }

      wordpressAttendeeCount += attendeeCount;

      bookingDetails.push({
        bookingId: booking.id,
        attendeeCount,
        hasAttendeesInfo: attendeesInfo.length > 0,
        attendeesInfoLength: attendeesInfo.length,
        tickets: booking.tickets || booking.count || 1,
        email: booking.email,
        name: booking.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim()
      });
    }

    // Count registrations in our database
    const registrations = await Registration.findAll({
      where: { eventId: event.id }
    });

    const dbAttendeeCount = registrations.length;

    // Group registrations by booking ID
    const registrationsByBooking = {};
    registrations.forEach(reg => {
      const bookingId = reg.mecBookingId;
      if (!registrationsByBooking[bookingId]) {
        registrationsByBooking[bookingId] = [];
      }
      registrationsByBooking[bookingId].push(reg);
    });

    // Find missing bookings and bookings with missing attendees
    const dbBookingIds = new Set(registrations.map(r => r.mecBookingId));
    const missingBookings = [];
    const incompleteBookings = [];

    for (const booking of allBookings) {
      const bookingId = String(booking.id);
      const attendeesInfo = booking.attendees_info || [];
      
      if (!dbBookingIds.has(bookingId)) {
        // Booking completely missing
        missingBookings.push(booking);
      } else {
        // Check if all attendees are synced
        let expectedAttendees = 0;
        if (attendeesInfo.length > 0) {
          expectedAttendees = attendeesInfo.filter(a => a.email && a.email.includes('@')).length;
        } else {
          const ticketCount = parseInt(booking.tickets || booking.count || 1);
          const hasValidEmail = booking.email && booking.email.includes('@');
          expectedAttendees = hasValidEmail ? ticketCount : 0;
        }

        const syncedAttendees = registrationsByBooking[bookingId]?.length || 0;
        if (syncedAttendees < expectedAttendees) {
          incompleteBookings.push({
            booking,
            expectedAttendees,
            syncedAttendees,
            missing: expectedAttendees - syncedAttendees
          });
        }
      }
    }

    res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        mecEventId: event.mecEventId,
        sourceUrl: event.sourceUrl
      },
      wordpress: {
        totalBookings: allBookings.length,
        totalAttendees: wordpressAttendeeCount,
        bookingDetails
      },
      database: {
        totalRegistrations: dbAttendeeCount,
        uniqueBookings: Object.keys(registrationsByBooking).length
      },
      discrepancy: {
        missing: wordpressAttendeeCount - dbAttendeeCount,
        missingBookings: missingBookings.length,
        incompleteBookings: incompleteBookings.length,
        missingBookingDetails: missingBookings.map(b => ({
          bookingId: b.id,
          eventId: b.event_id,
          email: b.email,
          name: b.name || `${b.first_name || ''} ${b.last_name || ''}`.trim(),
          attendeesInfoLength: (b.attendees_info || []).length,
          tickets: b.tickets || b.count || 1
        })),
        incompleteBookingDetails: incompleteBookings.map(ib => ({
          bookingId: ib.booking.id,
          eventId: ib.booking.event_id,
          expectedAttendees: ib.expectedAttendees,
          syncedAttendees: ib.syncedAttendees,
          missing: ib.missing,
          email: ib.booking.email,
          name: ib.booking.name || `${ib.booking.first_name || ''} ${ib.booking.last_name || ''}`.trim(),
          attendeesInfoLength: (ib.booking.attendees_info || []).length
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error debugging event bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error debugging event bookings',
      error: error.message
    });
  }
};