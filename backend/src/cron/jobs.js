import cron from 'node-cron';
import { Registration, Event } from '../models/index.js';
import { Op } from 'sequelize';
import mecService from '../services/mecService.js';
import emailService from '../services/emailService.js';

class CronJobs {
  constructor() {
    this.jobs = [];
  }

  // Sync events and bookings from MEC
  scheduleMECSync() {
    const schedule = process.env.SYNC_CRON_SCHEDULE || '0 */3 * * *'; // Every 3 hours by default
    
    const job = cron.schedule(schedule, async () => {
      console.log('🔄 Running scheduled MEC sync...');
      try {
        await mecService.syncAll();
        console.log('✅ Scheduled MEC sync completed');
      } catch (error) {
        console.error('❌ Error in scheduled MEC sync:', error.message);
      }
    });

    this.jobs.push(job);
    console.log(`📅 MEC sync scheduled: ${schedule}`);
  }

  // Send event reminders 24 hours before event
  scheduleEventReminders() {
    const schedule = process.env.REMINDER_CRON_SCHEDULE || '0 9 * * *'; // 9 AM daily by default
    
    const job = cron.schedule(schedule, async () => {
      console.log('📧 Running event reminder job...');
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // Find events happening tomorrow
        const upcomingEvents = await Event.findAll({
          where: {
            startDate: {
              [Op.gte]: tomorrow,
              [Op.lt]: dayAfterTomorrow
            },
            status: { [Op.in]: ['upcoming', 'ongoing'] }
          },
          include: [
            {
              model: Registration,
              as: 'registrations',
              where: {
                reminderSent: false
              },
              required: false
            }
          ]
        });

        let sentCount = 0;
        let errorCount = 0;

        for (const event of upcomingEvents) {
          for (const registration of event.registrations) {
            if (!registration.reminderSent) {
              try {
                await emailService.sendEventReminder(registration, event);
                await registration.update({
                  reminderSent: true,
                  reminderSentAt: new Date()
                });
                sentCount++;
              } catch (error) {
                console.error(`Error sending reminder to ${registration.attendeeEmail}:`, error.message);
                errorCount++;
              }
            }
          }
        }

        console.log(`✅ Sent ${sentCount} reminders, ${errorCount} errors`);
      } catch (error) {
        console.error('❌ Error in reminder job:', error.message);
      }
    });

    this.jobs.push(job);
    console.log(`📅 Event reminders scheduled: ${schedule}`);
  }

  // Send follow-up emails after events
  scheduleFollowUps() {
    const schedule = '0 10 * * *'; // 10 AM daily
    
    const job = cron.schedule(schedule, async () => {
      console.log('📧 Running follow-up email job...');
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find events that ended yesterday
        const completedEvents = await Event.findAll({
          where: {
            endDate: {
              [Op.gte]: yesterday,
              [Op.lt]: today
            },
            status: 'completed'
          },
          include: [
            {
              model: Registration,
              as: 'registrations',
              where: {
                checkedIn: true,
                followUpSent: false
              },
              required: false
            }
          ]
        });

        let sentCount = 0;
        let errorCount = 0;

        for (const event of completedEvents) {
          for (const registration of event.registrations) {
            if (!registration.followUpSent && registration.checkedIn) {
              try {
                await emailService.sendFollowUp(registration, event);
                await registration.update({
                  followUpSent: true,
                  followUpSentAt: new Date()
                });
                sentCount++;
              } catch (error) {
                console.error(`Error sending follow-up to ${registration.attendeeEmail}:`, error.message);
                errorCount++;
              }
            }
          }
        }

        console.log(`✅ Sent ${sentCount} follow-up emails, ${errorCount} errors`);
      } catch (error) {
        console.error('❌ Error in follow-up job:', error.message);
      }
    });

    this.jobs.push(job);
    console.log(`📅 Follow-up emails scheduled: ${schedule}`);
  }

  // Update event statuses
  scheduleStatusUpdates() {
    const schedule = '0 0 * * *'; // Midnight daily
    
    const job = cron.schedule(schedule, async () => {
      console.log('🔄 Updating event statuses...');
      try {
        const now = new Date();

        // Mark past events as completed
        await Event.update(
          { status: 'completed' },
          {
            where: {
              endDate: { [Op.lt]: now },
              status: { [Op.ne]: 'completed' }
            }
          }
        );

        // Mark ongoing events
        await Event.update(
          { status: 'ongoing' },
          {
            where: {
              startDate: { [Op.lte]: now },
              endDate: { [Op.gte]: now },
              status: 'upcoming'
            }
          }
        );

        console.log('✅ Event statuses updated');
      } catch (error) {
        console.error('❌ Error updating event statuses:', error.message);
      }
    });

    this.jobs.push(job);
    console.log(`📅 Status updates scheduled: ${schedule}`);
  }

  startAll() {
    console.log('\n🚀 Starting all cron jobs...\n');
    this.scheduleMECSync();
    this.scheduleEventReminders();
    this.scheduleFollowUps();
    this.scheduleStatusUpdates();
    console.log('\n✅ All cron jobs started\n');
  }

  stopAll() {
    console.log('🛑 Stopping all cron jobs...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('✅ All cron jobs stopped');
  }
}

export default new CronJobs();

