import sequelize from '../config/database.js';
import { Event, Registration } from '../models/index.js';

/**
 * Migration script to add multi-site support
 * 
 * This script:
 * 1. Adds sourceUrl column to events table
 * 2. Adds sourceUrl column to registrations table
 * 3. Updates unique constraints to be per-site
 * 4. Migrates existing data to use a default source URL
 */

const DEFAULT_SOURCE_URL = process.env.DEFAULT_SOURCE_URL || 'https://housesoflight.org';

async function migrateMultiSite() {
  console.log('🔄 Starting multi-site migration...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Add sourceUrl column to events table
    console.log('📝 Step 1: Adding sourceUrl column to events table...');
    await sequelize.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS "sourceUrl" VARCHAR(255);
    `);
    console.log('✅ Column added\n');

    // Step 2: Update existing events with default source URL
    console.log('📝 Step 2: Updating existing events with default source URL...');
    const [eventsUpdated] = await sequelize.query(`
      UPDATE events 
      SET "sourceUrl" = :sourceUrl 
      WHERE "sourceUrl" IS NULL;
    `, {
      replacements: { sourceUrl: DEFAULT_SOURCE_URL }
    });
    console.log(`✅ Updated ${eventsUpdated} events\n`);

    // Step 3: Make sourceUrl NOT NULL
    console.log('📝 Step 3: Setting sourceUrl as NOT NULL...');
    await sequelize.query(`
      ALTER TABLE events 
      ALTER COLUMN "sourceUrl" SET NOT NULL;
    `);
    console.log('✅ Column constraint updated\n');

    // Step 4: Drop old unique constraint on mecEventId
    console.log('📝 Step 4: Updating event unique constraints...');
    try {
      await sequelize.query(`
        ALTER TABLE events 
        DROP CONSTRAINT IF EXISTS "events_mecEventId_key";
      `);
      console.log('✅ Old constraint removed\n');
    } catch (error) {
      console.log('⚠️  Old constraint might not exist, continuing...\n');
    }

    // Step 5: Create new composite unique constraint
    console.log('📝 Step 5: Creating new composite unique constraint for events...');
    try {
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_event_per_site 
        ON events ("sourceUrl", "mecEventId");
      `);
      console.log('✅ New constraint created\n');
    } catch (error) {
      console.log('⚠️  Constraint might already exist, continuing...\n');
    }

    // Step 6: Create index on sourceUrl
    console.log('📝 Step 6: Creating index on sourceUrl for events...');
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS events_source_url_idx 
        ON events ("sourceUrl");
      `);
      console.log('✅ Index created\n');
    } catch (error) {
      console.log('⚠️  Index might already exist, continuing...\n');
    }

    // Step 7: Add sourceUrl column to registrations table
    console.log('📝 Step 7: Adding sourceUrl column to registrations table...');
    await sequelize.query(`
      ALTER TABLE registrations 
      ADD COLUMN IF NOT EXISTS "sourceUrl" VARCHAR(255);
    `);
    console.log('✅ Column added\n');

    // Step 8: Update existing registrations with source URL from their events
    console.log('📝 Step 8: Updating existing registrations with source URLs...');
    const [registrationsUpdated] = await sequelize.query(`
      UPDATE registrations r
      SET "sourceUrl" = e."sourceUrl"
      FROM events e
      WHERE r."eventId" = e.id 
        AND r."sourceUrl" IS NULL;
    `);
    console.log(`✅ Updated ${registrationsUpdated} registrations\n`);

    // Step 9: Make sourceUrl NOT NULL for registrations
    console.log('📝 Step 9: Setting sourceUrl as NOT NULL for registrations...');
    await sequelize.query(`
      ALTER TABLE registrations 
      ALTER COLUMN "sourceUrl" SET NOT NULL;
    `);
    console.log('✅ Column constraint updated\n');

    // Step 10: Drop old unique constraint on mecBookingId
    console.log('📝 Step 10: Updating registration unique constraints...');
    try {
      await sequelize.query(`
        ALTER TABLE registrations 
        DROP CONSTRAINT IF EXISTS "registrations_mecBookingId_key";
      `);
      console.log('✅ Old constraint removed\n');
    } catch (error) {
      console.log('⚠️  Old constraint might not exist, continuing...\n');
    }

    // Step 11: Create new composite unique constraint for registrations
    console.log('📝 Step 11: Creating new composite unique constraint for registrations...');
    try {
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_per_site 
        ON registrations ("sourceUrl", "mecBookingId")
        WHERE "mecBookingId" IS NOT NULL;
      `);
      console.log('✅ New constraint created\n');
    } catch (error) {
      console.log('⚠️  Constraint might already exist, continuing...\n');
    }

    // Step 12: Create index on sourceUrl for registrations
    console.log('📝 Step 12: Creating index on sourceUrl for registrations...');
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS registrations_source_url_idx 
        ON registrations ("sourceUrl");
      `);
      console.log('✅ Index created\n');
    } catch (error) {
      console.log('⚠️  Index might already exist, continuing...\n');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Events updated: ${eventsUpdated}`);
    console.log(`   - Registrations updated: ${registrationsUpdated}`);
    console.log(`   - Default source URL used: ${DEFAULT_SOURCE_URL}\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMultiSite()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateMultiSite;

