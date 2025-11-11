import { sequelize } from '../models/index.js';

async function addAttendeeIndex() {
  try {
    console.log('🔧 Adding attendeeIndex column to registrations (if needed)...');
    await sequelize.query(`
      ALTER TABLE registrations
      ADD COLUMN IF NOT EXISTS "attendeeIndex" INTEGER DEFAULT 0 NOT NULL
    `);

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


