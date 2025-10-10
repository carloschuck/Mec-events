import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendRegistrationConfirmation(registration, event) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4a5568; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f7fafc; }
          .event-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4299e1; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.ORG_NAME || 'Event Registration'}</h1>
          </div>
          <div class="content">
            <h2>Registration Confirmed! 🎉</h2>
            <p>Dear ${registration.attendeeName},</p>
            <p>Thank you for registering for our event. We're excited to see you there!</p>
            
            <div class="event-details">
              <h3>${event.title}</h3>
              <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Location:</strong> ${event.location || 'TBA'}</p>
              ${event.address ? `<p><strong>Address:</strong> ${event.address}</p>` : ''}
              <p><strong>Number of Tickets:</strong> ${registration.numberOfTickets}</p>
            </div>
            
            <p>Please save this email for your records. You may be asked to show this confirmation at the event.</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>See you soon!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.ORG_NAME || 'Event Organization'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Registration Confirmed!

Dear ${registration.attendeeName},

Thank you for registering for ${event.title}.

Event Details:
- Date: ${new Date(event.startDate).toLocaleDateString()}
- Location: ${event.location || 'TBA'}
- Number of Tickets: ${registration.numberOfTickets}

See you soon!
    `;

    await this.sendEmail({
      to: registration.attendeeEmail,
      subject: `Registration Confirmed: ${event.title}`,
      html,
      text
    });
  }

  async sendEventReminder(registration, event) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ed8936; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #fffaf0; }
          .event-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ed8936; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Reminder ⏰</h1>
          </div>
          <div class="content">
            <h2>Don't Forget!</h2>
            <p>Dear ${registration.attendeeName},</p>
            <p>This is a friendly reminder about your upcoming event tomorrow!</p>
            
            <div class="event-details">
              <h3>${event.title}</h3>
              <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Location:</strong> ${event.location || 'TBA'}</p>
              ${event.address ? `<p><strong>Address:</strong> ${event.address}</p>` : ''}
            </div>
            
            <p>We look forward to seeing you there!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.ORG_NAME || 'Event Organization'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Event Reminder

Dear ${registration.attendeeName},

This is a friendly reminder about your upcoming event tomorrow!

Event: ${event.title}
Date: ${new Date(event.startDate).toLocaleDateString()}
Location: ${event.location || 'TBA'}

We look forward to seeing you there!
    `;

    await this.sendEmail({
      to: registration.attendeeEmail,
      subject: `Reminder: ${event.title} is Tomorrow!`,
      html,
      text
    });
  }

  async sendFollowUp(registration, event) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #48bb78; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f0fff4; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You! 🙏</h1>
          </div>
          <div class="content">
            <h2>Thanks for Attending</h2>
            <p>Dear ${registration.attendeeName},</p>
            <p>Thank you for attending ${event.title}. We hope you enjoyed the event!</p>
            
            <p>We'd love to hear your feedback. Your input helps us make our events even better.</p>
            
            <p>We look forward to seeing you at future events!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.ORG_NAME || 'Event Organization'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Thank You for Attending!

Dear ${registration.attendeeName},

Thank you for attending ${event.title}. We hope you enjoyed the event!

We'd love to hear your feedback and look forward to seeing you at future events!
    `;

    await this.sendEmail({
      to: registration.attendeeEmail,
      subject: `Thank You for Attending ${event.title}`,
      html,
      text
    });
  }
}

export default new EmailService();

