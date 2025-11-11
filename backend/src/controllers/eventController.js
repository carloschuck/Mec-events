import { Event, Registration, User } from '../models/index.js';
import { Op } from 'sequelize';
import mecService from '../services/mecService.js';
import pdfService from '../services/pdfService.js';

export const testMecConnection = async (req, res) => {
  try {
    const result = await mecService.testConnection();
    res.json({
      success: result.success,
      message: result.success ? 'MEC API connection successful' : 'MEC API connection failed',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing MEC connection',
      error: error.message
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { 
      status, 
      search, 
      page = 1, 
      limit = 10, 
      dateFilter,
      capacityFilter,
      sortBy = 'startDate',
      sortOrder = 'ASC',
      location
    } = req.query;

    const where = {};

    // Status filter
    if (status) {
      where.status = status;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Location filter
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }

    // Date range filters
    if (dateFilter) {
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          where.startDate = {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          };
          break;
        case 'thisWeek':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          where.startDate = {
            [Op.gte]: startOfWeek,
            [Op.lt]: endOfWeek
          };
          break;
        case 'thisMonth':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          where.startDate = {
            [Op.gte]: startOfMonth,
            [Op.lt]: endOfMonth
          };
          break;
        case 'next30Days':
          const next30Days = new Date(now);
          next30Days.setDate(now.getDate() + 30);
          where.startDate = {
            [Op.gte]: now,
            [Op.lte]: next30Days
          };
          break;
        case 'past':
          where.startDate = { [Op.lt]: now };
          break;
        case 'upcoming':
        default:
          where.startDate = { [Op.gte]: now };
          break;
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build order clause
    let order = [];
    if (sortBy === 'registrations') {
      // We'll handle this after getting the data
      order = [['startDate', sortOrder]];
    } else {
      order = [[sortBy, sortOrder]];
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: ['id', 'checkedIn']
        }
      ],
      order,
      limit: parseInt(limit),
      offset
    });

    // Add computed fields
    let eventsWithStats = events.map(event => {
      const eventJson = event.toJSON();
      const totalRegistrations = eventJson.registrations.length;
      const checkedInCount = eventJson.registrations.filter(r => r.checkedIn).length;
      const remainingSeats = eventJson.capacity - totalRegistrations;
      const capacityPercentage = eventJson.capacity > 0 
        ? Math.round((totalRegistrations / eventJson.capacity) * 100)
        : 0;

      return {
        ...eventJson,
        stats: {
          totalRegistrations,
          checkedInCount,
          remainingSeats: Math.max(0, remainingSeats),
          capacityPercentage
        }
      };
    });

    // Apply capacity filter after computing stats
    if (capacityFilter) {
      eventsWithStats = eventsWithStats.filter(event => {
        switch (capacityFilter) {
          case 'full':
            return event.stats.remainingSeats === 0 && event.capacity > 0;
          case 'available':
            return event.stats.remainingSeats > 0;
          case 'lowCapacity':
            return event.stats.capacityPercentage >= 80 && event.stats.remainingSeats > 0;
          case 'popular':
            return event.stats.totalRegistrations >= 10;
          case 'new':
            return event.stats.totalRegistrations <= 2;
          default:
            return true;
        }
      });
    }

    // Handle sorting by registrations
    if (sortBy === 'registrations') {
      eventsWithStats.sort((a, b) => {
        const aReg = a.stats.totalRegistrations;
        const bReg = b.stats.totalRegistrations;
        return sortOrder === 'ASC' ? aReg - bReg : bReg - aReg;
      });
    }

    res.json({
      success: true,
      data: {
        events: eventsWithStats,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

export const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: Registration,
          as: 'registrations',
          include: [
            {
              model: User,
              as: 'checkedInByUser',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const eventJson = event.toJSON();
    const totalRegistrations = eventJson.registrations.length;
    const checkedInCount = eventJson.registrations.filter(r => r.checkedIn).length;
    const remainingSeats = eventJson.capacity - totalRegistrations;
    const capacityPercentage = eventJson.capacity > 0 
      ? Math.round((totalRegistrations / eventJson.capacity) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        event: {
          ...eventJson,
          stats: {
            totalRegistrations,
            checkedInCount,
            remainingSeats: Math.max(0, remainingSeats),
            capacityPercentage
          }
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching event ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

export const syncEvents = async (req, res) => {
  try {
    // Check if MEC API is configured
    const mecApiUrl = process.env.MEC_API_URL;
    if (!mecApiUrl) {
      return res.json({
        success: true,
        message: 'MEC API not configured. Using webhook sync instead.',
        data: {
          events: 0,
          registrations: 0,
          method: 'webhook'
        }
      });
    }

    // Only sync events for now (bookings endpoint doesn't exist in MEC API)
    const result = await mecService.syncEvents();

    res.json({
      success: true,
      message: 'Events sync completed successfully',
      data: {
        events: result,
        bookings: { synced: 0, errors: 0 },
        method: 'api'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error syncing events',
      error: error.message
    });
  }
};

export const exportEventPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;

    const selectedFields = fields ? fields.split(',') : [];

    const pdfDoc = await pdfService.generateAttendeesPDF(id, selectedFields);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=event-${id}-attendees.pdf`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting PDF',
      error: error.message
    });
  }
};

export const exportEventCSV = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: ['registrations']
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Generate CSV
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Tickets',
      'Registration Date',
      'Checked In',
      'Check-in Time'
    ];

    const rows = event.registrations.map(r => [
      r.attendeeName,
      r.attendeeEmail,
      r.attendeePhone || 'N/A',
      r.numberOfTickets,
      new Date(r.registrationDate).toLocaleDateString(),
      r.checkedIn ? 'Yes' : 'No',
      r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event-${id}-attendees.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting CSV',
      error: error.message
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: ['id']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registrationCount = event.registrations?.length || 0;

    if (registrationCount > 0 && force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `Event has ${registrationCount} registration(s). Pass force=true to delete along with registrations.`,
        registrationCount
      });
    }

    if (registrationCount > 0) {
      await Registration.destroy({
        where: { eventId: event.id }
      });
    }

    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully',
      deletedRegistrations: registrationCount
    });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};

export const getEventFilters = async (req, res) => {
  try {
    // Get unique locations
    const locations = await Event.findAll({
      attributes: ['location'],
      where: {
        location: { [Op.ne]: null }
      },
      group: ['location'],
      order: [['location', 'ASC']]
    });

    // Get date range stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const next30Days = new Date(now);
    next30Days.setDate(now.getDate() + 30);

    const [todayCount, thisWeekCount, thisMonthCount, next30DaysCount, upcomingCount, pastCount] = await Promise.all([
      Event.count({ where: { startDate: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
      Event.count({ where: { startDate: { [Op.gte]: startOfWeek, [Op.lt]: endOfWeek } } }),
      Event.count({ where: { startDate: { [Op.gte]: startOfMonth, [Op.lt]: endOfMonth } } }),
      Event.count({ where: { startDate: { [Op.gte]: now, [Op.lte]: next30Days } } }),
      Event.count({ where: { startDate: { [Op.gte]: now } } }),
      Event.count({ where: { startDate: { [Op.lt]: now } } })
    ]);

    res.json({
      success: true,
      data: {
        locations: locations.map(l => l.location).filter(Boolean),
        dateStats: {
          today: todayCount,
          thisWeek: thisWeekCount,
          thisMonth: thisMonthCount,
          next30Days: next30DaysCount,
          upcoming: upcomingCount,
          past: pastCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

export const getEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: ['registrations']
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Group registrations by date
    const registrationsByDate = {};
    event.registrations.forEach(reg => {
      const date = new Date(reg.registrationDate).toISOString().split('T')[0];
      registrationsByDate[date] = (registrationsByDate[date] || 0) + 1;
    });

    // Convert to array for chart
    const dailyRegistrations = Object.entries(registrationsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalRegistrations = event.registrations.length;
    const checkedInCount = event.registrations.filter(r => r.checkedIn).length;
    const notCheckedInCount = totalRegistrations - checkedInCount;

    res.json({
      success: true,
      data: {
        dailyRegistrations,
        pieData: [
          { name: 'Checked In', value: checkedInCount },
          { name: 'Not Checked In', value: notCheckedInCount }
        ],
        stats: {
          totalRegistrations,
          checkedInCount,
          notCheckedInCount,
          remainingSeats: Math.max(0, event.capacity - totalRegistrations),
          capacityPercentage: event.capacity > 0 
            ? Math.round((totalRegistrations / event.capacity) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error fetching analytics for event ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

