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
    const { status, search, page = 1, limit = 10 } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: ['id', 'checkedIn']
        }
      ],
      order: [['startDate', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    // Add computed fields
    const eventsWithStats = events.map(event => {
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
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

export const syncEvents = async (req, res) => {
  try {
    const result = await mecService.syncAll();

    res.json({
      success: true,
      message: 'Sync completed successfully',
      data: result
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
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

