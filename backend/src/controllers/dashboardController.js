import { Event, Registration } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // Total events
    const totalEvents = await Event.count();

    // Total registrations
    const totalRegistrations = await Registration.count();

    // Total checked in
    const totalCheckedIn = await Registration.count({
      where: { checkedIn: true }
    });

    // Upcoming events
    const upcomingEvents = await Event.findAll({
      where: {
        startDate: { [Op.gte]: now },
        status: { [Op.in]: ['upcoming', 'ongoing'] }
      },
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: ['id', 'checkedIn']
        }
      ],
      order: [['startDate', 'ASC']],
      limit: 5
    });

    // Recent registrations
    const recentRegistrations = await Registration.findAll({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'startDate']
        }
      ],
      order: [['registrationDate', 'DESC']],
      limit: 10
    });

    // Events by status
    const eventsByStatus = await Event.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Registrations trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrationsTrend = await Registration.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('registrationDate')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        registrationDate: { [Op.gte]: thirtyDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('registrationDate'))],
      order: [[sequelize.fn('DATE', sequelize.col('registrationDate')), 'ASC']]
    });

    // Top events by registrations
    const topEventsRaw = await Event.findAll({
      include: [
        {
          model: Registration,
          as: 'registrations',
          attributes: []
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('registrations.id')), 'registrationCount']
        ]
      },
      group: ['Event.id'],
      order: [[sequelize.literal('COUNT("registrations"."id")'), 'DESC']],
      limit: 5,
      subQuery: false
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          totalRegistrations,
          totalCheckedIn,
          checkInRate: totalRegistrations > 0 
            ? Math.round((totalCheckedIn / totalRegistrations) * 100)
            : 0
        },
        upcomingEvents: upcomingEvents.map(event => {
          const eventJson = event.toJSON();
          return {
            ...eventJson,
            stats: {
              totalRegistrations: eventJson.registrations.length,
              checkedInCount: eventJson.registrations.filter(r => r.checkedIn).length
            }
          };
        }),
        recentRegistrations,
        eventsByStatus,
        registrationsTrend: registrationsTrend.map(item => ({
          date: item.getDataValue('date'),
          count: parseInt(item.getDataValue('count'))
        })),
        topEvents: topEventsRaw.map(event => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          registrationCount: parseInt(event.getDataValue('registrationCount') || 0)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

