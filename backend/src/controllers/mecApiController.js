import { Event, Registration } from '../models/index.js';
import { Op } from 'sequelize';

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
    
    const mecApiUrl = process.env.MEC_API_URL;
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
    
    const mecApiUrl = process.env.MEC_API_URL;
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
    
    const mecApiUrl = process.env.MEC_API_URL;
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
    
    const mecApiUrl = process.env.MEC_API_URL;
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
    
    const mecApiUrl = process.env.MEC_API_URL;
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
    const mecApiUrl = process.env.MEC_API_URL?.replace('/wp-json/mec/v1.0', '') || process.env.MEC_API_URL;
    const apiKey = process.env.MEC_API_KEY;
    
    if (!mecApiUrl) {
      return res.status(400).json({
        success: false,
        message: 'MEC API not configured. Please set MEC_API_URL environment variable.'
      });
    }
    
    console.log('🔄 Starting MEC Bridge API events sync...');
    
    // Calculate date range for upcoming events (next 12 months)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    
    console.log(`📅 Fetching events from ${startDate} to ${endDate}`);
    
    // Fetch events from custom MEC Bridge API endpoint with date filters
    const params = new URLSearchParams({
      per_page: '100',
      start_date: startDate,
      end_date: endDate
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
    
    console.log(`📥 Fetched ${events.length} events from MEC Bridge API`);
    
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

        // Skip past events - only sync upcoming or ongoing events
        const now = new Date();
        if (endDate && endDate < now) {
          console.log(`⏭️  Skipping past event: ${event.title} (ended ${endDate.toLocaleDateString()})`);
          continue;
        }

        // Determine event status based on dates
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
    const mecApiUrl = process.env.MEC_API_URL?.replace('/wp-json/mec/v1.0', '') || process.env.MEC_API_URL;
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
      baseURL: process.env.MEC_API_URL || 'Not configured',
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