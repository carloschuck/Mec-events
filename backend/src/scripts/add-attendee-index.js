import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';

async function addAttendeeIndex() {
  try {
    console.log('🔧 Adding attendeeIndex column to registrations (if needed)...');
    await sequelize.query(`
      ALTER TABLE registrations
      ADD COLUMN IF NOT EXISTS "attendeeIndex" INTEGER DEFAULT 0 NOT NULL
    `);

    // Copy attendeeIndex from metadata if missing
    console.log('🔧 Populating attendeeIndex from metadata where null...');
    await sequelize.query(
      `
      UPDATE registrations
      SET "attendeeIndex" = COALESCE(
        (metadata->>'attendeeIndex')::INTEGER,
        0
      )
      WHERE "attendeeIndex" IS NULL
      `,
      { type: QueryTypes.UPDATE }
    );

    // Expand legacy rows that stored numberOfTickets > 1 into separate attendees
    console.log('🔧 Expanding legacy multi-ticket registrations...');
    const legacyRows = await sequelize.query(
      `
      SELECT id, "sourceUrl", "mecBookingId", "eventId", "attendeeName", "attendeeEmail", "attendeePhone",
             "registrationDate", metadata, "numberOfTickets"
      FROM registrations
      WHERE "numberOfTickets" > 1
      `,
      { type: QueryTypes.SELECT }
    );

    for (const row of legacyRows) {
      const ticketCount = row.numberOfTickets;
      for (let i = 0; i < ticketCount; i++) {
        await sequelize.query(
          `
          INSERT INTO registrations ("sourceUrl", "mecBookingId", "eventId", "attendeeName", "attendeeEmail",
                                     "attendeePhone", "registrationDate", metadata, "numberOfTickets", "attendeeIndex",
                                     "createdAt", "updatedAt")
          VALUES (:sourceUrl, :mecBookingId, :eventId, :attendeeName, :attendeeEmail,
                  :attendeePhone, :registrationDate, :metadata, 1, :attendeeIndex, NOW(), NOW())
          ON CONFLICT ("sourceUrl", "mecBookingId", "attendeeIndex")
          DO UPDATE SET
            "attendeeName" = EXCLUDED."attendeeName",
            "attendeeEmail" = EXCLUDED."attendeeEmail",
            metadata = EXCLUDED.metadata,
            "updatedAt" = NOW()
          `,
          {
            type: QueryTypes.INSERT,
            replacements: {
              sourceUrl: row.sourceUrl,
              mecBookingId: row.mecBookingId,
              eventId: row.eventId,
              attendeeName: ticketCount > 1 ? `${row.attendeeName || 'Unknown'} (Seat ${i + 1})` : row.attendeeName,
              attendeeEmail: row.attendeeEmail,
              attendeePhone: row.attendeePhone,
              registrationDate: row.registrationDate,
              metadata: {
                ...(row.metadata || {}),
                attendeeIndex: i,
                totalAttendees: ticketCount
              },
              attendeeIndex: i
            }
          }
        );
      }

      // Remove original aggregated row if it was a single record
      await sequelize.query(
        `DELETE FROM registrations WHERE id = :id`,
        { type: QueryTypes.DELETE, replacements: { id: row.id } }
      );
    }

    console.log('🔧 Dropping old unique index (if exists)...');
    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'unique_booking_per_site'
        ) THEN
          DROP INDEX unique_booking_per_site;
        END IF;
      END
      $$;
    `);

    console.log('🔧 Creating new unique index on sourceUrl, mecBookingId, attendeeIndex...');
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_per_site
      ON registrations("sourceUrl", "mecBookingId", "attendeeIndex")
    `);

    console.log('✅ attendeeIndex migration completed successfully.');
  } catch (error) {
    console.error('❌ Failed to update registrations table:', error);
  } finally {
    await sequelize.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  addAttendeeIndex();
}

export default addAttendeeIndex;


