import { Registration, Event, User } from '../models/index.js';
import { Op } from 'sequelize';
import pdfService from '../services/pdfService.js';

export const getAttendees = async (req, res) => {
  try {
    const { 
      search, 
      eventId, 
      checkedIn, 
      page = 1, 
      limit = 50,
      sortBy = 'attendeeName',
      sortOrder = 'ASC'
    } = req.query;

    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { attendeeName: { [Op.iLike]: `%${search}%` } },
        { attendeeEmail: { [Op.iLike]: `%${search}%` } },
        { attendeePhone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Event filter
    if (eventId) {
      where.eventId = eventId;
    }

    // Check-in status filter
    if (checkedIn !== undefined && checkedIn !== '') {
      where.checkedIn = checkedIn === 'true';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build order clause
    let order = [];
    if (sortBy === 'eventTitle') {
      order = [
        [{ model: Event, as: 'event' }, 'title', sortOrder],
        ['attendeeName', 'ASC']
      ];
    } else {
      order = [[sortBy, sortOrder]];
    }

    const { count, rows: registrations } = await Registration.findAndCountAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'startDate', 'location']
        },
        {
          model: User,
          as: 'checkedInByUser',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order,
      limit: parseInt(limit),
      offset
    });

    // Format the response
    const attendees = registrations.map(reg => {
      const regJson = reg.toJSON();
      return {
        id: regJson.id,
        name: regJson.attendeeName,
        email: regJson.attendeeEmail,
        phone: regJson.attendeePhone,
        numberOfTickets: regJson.numberOfTickets,
        registrationDate: regJson.registrationDate,
        checkedIn: regJson.checkedIn,
        checkedInAt: regJson.checkedInAt,
        event: regJson.event ? {
          id: regJson.event.id,
          title: regJson.event.title,
          startDate: regJson.event.startDate,
          location: regJson.event.location
        } : null,
        checkedInBy: regJson.checkedInByUser ? {
          id: regJson.checkedInByUser.id,
          name: `${regJson.checkedInByUser.firstName} ${regJson.checkedInByUser.lastName}`.trim()
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        attendees,
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
      message: 'Error fetching attendees',
      error: error.message
    });
  }
};

export const getAttendeeStats = async (req, res) => {
  try {
    const totalAttendees = await Registration.count();
    const checkedInCount = await Registration.count({ where: { checkedIn: true } });
    const notCheckedInCount = totalAttendees - checkedInCount;

    // Get unique events count
    const uniqueEvents = await Registration.findAll({
      attributes: ['eventId'],
      group: ['eventId']
    });

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await Registration.count({
      where: {
        registrationDate: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalAttendees,
        checkedInCount,
        notCheckedInCount,
        uniqueEvents: uniqueEvents.length,
        recentRegistrations,
        checkInRate: totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendee stats',
      error: error.message
    });
  }
};

export const exportAttendeesPDF = async (req, res) => {
  try {
    const { eventId, checkedIn, search } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { attendeeName: { [Op.iLike]: `%${search}%` } },
        { attendeeEmail: { [Op.iLike]: `%${search}%` } },
        { attendeePhone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (checkedIn !== undefined && checkedIn !== '') {
      where.checkedIn = checkedIn === 'true';
    }

    const registrations = await Registration.findAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'startDate', 'location']
        }
      ],
      order: [['attendeeName', 'ASC']]
    });

    // Generate PDF
    const pdfDoc = await pdfService.generateAttendeesListPDF(registrations);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendees-list.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting attendees PDF',
      error: error.message
    });
  }
};

export const exportAttendeesCSV = async (req, res) => {
  try {
    const { eventId, checkedIn, search } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { attendeeName: { [Op.iLike]: `%${search}%` } },
        { attendeeEmail: { [Op.iLike]: `%${search}%` } },
        { attendeePhone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (checkedIn !== undefined && checkedIn !== '') {
      where.checkedIn = checkedIn === 'true';
    }

    const registrations = await Registration.findAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'startDate', 'location']
        }
      ],
      order: [['attendeeName', 'ASC']]
    });

    // Generate CSV
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Event',
      'Event Date',
      'Location',
      'Tickets',
      'Registration Date',
      'Checked In',
      'Check-in Time'
    ];

    const rows = registrations.map(reg => [
      reg.attendeeName,
      reg.attendeeEmail,
      reg.attendeePhone || 'N/A',
      reg.event ? reg.event.title : 'N/A',
      reg.event ? new Date(reg.event.startDate).toLocaleDateString() : 'N/A',
      reg.event ? (reg.event.location || 'N/A') : 'N/A',
      reg.numberOfTickets,
      new Date(reg.registrationDate).toLocaleDateString(),
      reg.checkedIn ? 'Yes' : 'No',
      reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendees-list.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting attendees CSV',
      error: error.message
    });
  }
};

export const getAttendeeFilters = async (req, res) => {
  try {
    // Get unique events for filtering
    const events = await Event.findAll({
      attributes: ['id', 'title', 'startDate'],
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: ['id']
        }
      ],
      where: {
        '$registrations.id$': { [Op.ne]: null }
      },
      order: [['startDate', 'DESC']]
    });

    // Get check-in stats
    const totalAttendees = await Registration.count();
    const checkedInCount = await Registration.count({ where: { checkedIn: true } });
    const notCheckedInCount = totalAttendees - checkedInCount;

    res.json({
      success: true,
      data: {
        events: events.map(event => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          attendeeCount: event.registrations.length
        })),
        checkInStats: {
          total: totalAttendees,
          checkedIn: checkedInCount,
          notCheckedIn: notCheckedInCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendee filters',
      error: error.message
    });
  }
};
