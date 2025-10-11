import PDFDocument from 'pdfkit';
import { Registration, Event } from '../models/index.js';

class PDFService {
  async generateAttendeesListPDF(registrations) {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Add header
      this.addHeader(doc);

      // Add title
      doc.fontSize(16)
        .text('All Attendees List', { align: 'center' })
        .moveDown();

      doc.fontSize(10)
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
        .moveDown(2);

      // Add summary
      const totalRegistrations = registrations.length;
      const checkedInCount = registrations.filter(r => r.checkedIn).length;

      doc.fontSize(12)
        .text(`Total Attendees: ${totalRegistrations}`)
        .text(`Checked In: ${checkedInCount}`)
        .text(`Not Checked In: ${totalRegistrations - checkedInCount}`)
        .moveDown(2);

      // Define fields
      const fields = [
        'attendeeName',
        'attendeeEmail', 
        'attendeePhone',
        'eventTitle',
        'eventDate',
        'numberOfTickets',
        'registrationDate',
        'checkedIn'
      ];

      const fieldLabels = {
        attendeeName: 'Name',
        attendeeEmail: 'Email',
        attendeePhone: 'Phone',
        eventTitle: 'Event',
        eventDate: 'Event Date',
        numberOfTickets: 'Tickets',
        registrationDate: 'Registration Date',
        checkedIn: 'Check-in Status'
      };

      // Add table header
      doc.fontSize(10).font('Helvetica-Bold');
      let xPosition = 50;
      const columnWidth = (doc.page.width - 100) / fields.length;

      fields.forEach(field => {
        doc.text(fieldLabels[field], xPosition, doc.y, { 
          width: columnWidth, 
          continued: false 
        });
        xPosition += columnWidth;
      });

      doc.moveDown();
      doc.font('Helvetica');

      // Add table rows
      registrations.forEach((registration, index) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          this.addHeader(doc);
        }

        xPosition = 50;
        const startY = doc.y;

        fields.forEach(field => {
          let value = '';

          switch (field) {
            case 'attendeeName':
              value = registration.attendeeName;
              break;
            case 'attendeeEmail':
              value = registration.attendeeEmail;
              break;
            case 'attendeePhone':
              value = registration.attendeePhone || 'N/A';
              break;
            case 'eventTitle':
              value = registration.event ? registration.event.title : 'N/A';
              break;
            case 'eventDate':
              value = registration.event 
                ? new Date(registration.event.startDate).toLocaleDateString()
                : 'N/A';
              break;
            case 'numberOfTickets':
              value = String(registration.numberOfTickets);
              break;
            case 'registrationDate':
              value = new Date(registration.registrationDate).toLocaleDateString();
              break;
            case 'checkedIn':
              value = registration.checkedIn ? 'Yes' : 'No';
              break;
            default:
              value = 'N/A';
          }

          doc.text(value, xPosition, startY, { 
            width: columnWidth,
            continued: false,
            ellipsis: true
          });

          xPosition += columnWidth;
        });

        doc.moveDown(0.5);
      });

      // Add footer
      this.addFooter(doc);

      return doc;
    } catch (error) {
      console.error('Error generating attendees list PDF:', error);
      throw new Error('Failed to generate attendees list PDF');
    }
  }

  async generateAttendeesPDF(eventId, selectedFields = []) {
    try {
      const event = await Event.findByPk(eventId, {
        include: ['registrations']
      });

      if (!event) {
        throw new Error('Event not found');
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Add header
      this.addHeader(doc, event);

      // Add title
      doc.fontSize(16)
        .text(`Attendee List: ${event.title}`, { align: 'center' })
        .moveDown();

      doc.fontSize(10)
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
        .moveDown(2);

      // Add summary
      const totalRegistrations = event.registrations.length;
      const checkedInCount = event.registrations.filter(r => r.checkedIn).length;

      doc.fontSize(12)
        .text(`Total Registrations: ${totalRegistrations}`)
        .text(`Checked In: ${checkedInCount}`)
        .text(`Not Checked In: ${totalRegistrations - checkedInCount}`)
        .moveDown(2);

      // Define available fields
      const availableFields = {
        attendeeName: 'Name',
        attendeeEmail: 'Email',
        attendeePhone: 'Phone',
        numberOfTickets: 'Tickets',
        registrationDate: 'Registration Date',
        checkedIn: 'Check-in Status',
        checkedInAt: 'Check-in Time'
      };

      // Use selected fields or all fields
      const fields = selectedFields.length > 0 
        ? selectedFields.filter(f => availableFields[f])
        : Object.keys(availableFields);

      // Add table header
      doc.fontSize(10).font('Helvetica-Bold');
      let xPosition = 50;
      const columnWidth = (doc.page.width - 100) / fields.length;

      fields.forEach(field => {
        doc.text(availableFields[field], xPosition, doc.y, { 
          width: columnWidth, 
          continued: false 
        });
        xPosition += columnWidth;
      });

      doc.moveDown();
      doc.font('Helvetica');

      // Add table rows
      event.registrations.forEach((registration, index) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          this.addHeader(doc, event);
        }

        xPosition = 50;
        const startY = doc.y;

        fields.forEach(field => {
          let value = '';

          switch (field) {
            case 'attendeeName':
              value = registration.attendeeName;
              break;
            case 'attendeeEmail':
              value = registration.attendeeEmail;
              break;
            case 'attendeePhone':
              value = registration.attendeePhone || 'N/A';
              break;
            case 'numberOfTickets':
              value = String(registration.numberOfTickets);
              break;
            case 'registrationDate':
              value = new Date(registration.registrationDate).toLocaleDateString();
              break;
            case 'checkedIn':
              value = registration.checkedIn ? 'Yes' : 'No';
              break;
            case 'checkedInAt':
              value = registration.checkedInAt 
                ? new Date(registration.checkedInAt).toLocaleString()
                : 'N/A';
              break;
            default:
              value = 'N/A';
          }

          doc.text(value, xPosition, startY, { 
            width: columnWidth,
            continued: false,
            ellipsis: true
          });

          xPosition += columnWidth;
        });

        doc.moveDown(0.5);
      });

      // Add footer
      this.addFooter(doc);

      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  addHeader(doc, event = null) {
    const orgName = process.env.ORG_NAME || 'Event Organization';
    
    doc.fontSize(20)
      .text(orgName, { align: 'center' })
      .moveDown(0.5);

    // Add a line
    doc.moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke()
      .moveDown();
  }

  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
        .text(
          `Page ${i + 1} of ${pageCount} | ${process.env.ORG_NAME || 'Event Organization'}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }
  }
}

export default new PDFService();

