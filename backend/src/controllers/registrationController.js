import { Registration, Event, User } from '../models/index.js';
import { Op } from 'sequelize';
import qrService from '../services/qrService.js';
import emailService from '../services/emailService.js';

export const getRegistrations = async (req, res) => {
  try {
    const { eventId, search, checkedIn, page = 1, limit = 50 } = req.query;

    const where = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (search) {
      where[Op.or] = [
        { attendeeName: { [Op.iLike]: `%${search}%` } },
        { attendeeEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (checkedIn !== undefined) {
      where.checkedIn = checkedIn === 'true';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

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
      order: [['registrationDate', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        registrations,
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
      message: 'Error fetching registrations',
      error: error.message
    });
  }
};

export const getRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'event'
        },
        {
          model: User,
          as: 'checkedInByUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: { registration }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registration',
      error: error.message
    });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findByPk(id, {
      include: ['event']
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Attendee already checked in',
        data: {
          checkedInAt: registration.checkedInAt,
          checkedInBy: registration.checkedInBy
        }
      });
    }

    await registration.update({
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy: req.user.id
    });

    // Reload with user data
    await registration.reload({
      include: [
        'event',
        {
          model: User,
          as: 'checkedInByUser',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Check-in successful',
      data: { registration }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking in',
      error: error.message
    });
  }
};

export const checkInByQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    // Parse QR code to get registration ID
    const registrationId = qrService.parseQRCode(qrData);

    if (!registrationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code'
      });
    }

    // Use existing check-in logic
    req.params.id = registrationId;
    return checkIn(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking in with QR code',
      error: error.message
    });
  }
};

export const undoCheckIn = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findByPk(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (!registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Attendee is not checked in'
      });
    }

    await registration.update({
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null
    });

    res.json({
      success: true,
      message: 'Check-in undone successfully',
      data: { registration }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error undoing check-in',
      error: error.message
    });
  }
};

export const generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findByPk(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Generate QR code if not already generated
    if (!registration.qrCode) {
      const qrCode = await qrService.generateQRCode(registration.id);
      await registration.update({ qrCode });
    }

    res.json({
      success: true,
      data: {
        qrCode: registration.qrCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating QR code',
      error: error.message
    });
  }
};

export const sendReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findByPk(id, {
      include: ['event']
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    await emailService.sendEventReminder(registration, registration.event);

    await registration.update({
      reminderSent: true,
      reminderSentAt: new Date()
    });

    res.json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending reminder',
      error: error.message
    });
  }
};

