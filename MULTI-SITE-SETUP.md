# Multi-Site Setup Guide

This guide explains how to configure the MEC Events system to collect events from multiple WordPress sites into a single centralized database and management system.

## Overview

The system now supports multiple WordPress sites sending events to the same backend. Each site's events and bookings are uniquely identified by their source URL, preventing conflicts and allowing you to manage events from different organizations or departments in one place.

## Architecture

```
WordPress Site 1 (housesoflight.org)     ─┐
   └─ MEC Plugin                          │
   └─ Webhook Bridge Plugin               │
                                          │
WordPress Site 2 (example.org)            ├──→  Central Backend API
   └─ MEC Plugin                          │         └─ PostgreSQL Database
   └─ Webhook Bridge Plugin               │              └─ Events (with sourceUrl)
                                          │              └─ Registrations (with sourceUrl)
WordPress Site 3 (another.org)            │
   └─ MEC Plugin                          │
   └─ Webhook Bridge Plugin               ─┘
```

## Prerequisites

1. ✅ Backend system deployed and running
2. ✅ PostgreSQL database set up
3. ✅ Modern Events Calendar (MEC) installed on each WordPress site
4. ✅ Access to install plugins on each WordPress site

## Step 1: Database Migration

If you already have data in the system, run the migration script to add multi-site support:

```bash
cd backend
node src/scripts/migrate-multi-site.js
```

**What this does:**
- Adds `sourceUrl` column to events and registrations tables
- Updates unique constraints to be per-site
- Migrates existing data to use a default source URL
- Creates necessary indexes

**Environment Variable:**
Set `DEFAULT_SOURCE_URL` in your `.env` if you want to specify the source URL for existing data:
```env
DEFAULT_SOURCE_URL=https://housesoflight.org
```

## Step 2: Backend Configuration

Your backend `.env` should include:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mec_events

# Webhook Configuration
WEBHOOK_SECRET=your-secret-key-change-in-production

# Optional: Default source URL for migration
DEFAULT_SOURCE_URL=https://housesoflight.org
```

**Important:** Use the **same** `WEBHOOK_SECRET` for all WordPress sites.

## Step 3: Install WordPress Plugin on Each Site

For **each WordPress site** you want to collect events from:

### 3.1 Upload the Plugin

1. Go to the WordPress site's admin panel
2. Navigate to `Plugins → Add New → Upload Plugin`
3. Upload `mec-webhook-bridge.php`
4. Click `Install Now` and then `Activate`

### 3.2 Configure the Plugin

1. Go to `Settings → MEC Webhook Bridge`
2. Enter your webhook configuration:

```
Webhook URL: https://your-backend-domain.com/api/webhooks/mec
Webhook Secret: your-secret-key-change-in-production
☑ Enable webhook notifications
```

**Important Notes:**
- Use the **same Webhook URL** for all sites
- Use the **same Webhook Secret** for all sites (must match backend `WEBHOOK_SECRET`)
- Each site automatically includes its URL in webhook payloads

### 3.3 Test the Webhook

1. Click `Send Test Webhook` button
2. Verify you see a success message
3. Check your backend logs to confirm receipt

## Step 4: Verify Multi-Site Setup

After installing on multiple sites, verify the setup:

### Backend Verification

Check the backend logs when webhooks are received:
```
📥 Received webhook: event.published
   From: https://housesoflight.org
   Time: 2025-10-10 14:30:00

✅ Event 123 synced from https://housesoflight.org: Conference 2025
```

### Database Verification

Query the database to see events from different sources:

```sql
-- View events grouped by source
SELECT "sourceUrl", COUNT(*) as event_count
FROM events
GROUP BY "sourceUrl";

-- View all sources
SELECT DISTINCT "sourceUrl" FROM events;
```

### Frontend Verification

The admin dashboard should show:
- All events from all sites
- Source URL visible for each event
- Ability to filter events by source (future enhancement)

## Step 5: Managing Multiple Sites

### Adding a New Site

To add a new WordPress site to the system:

1. Install and activate MEC on the new site
2. Install and configure the Webhook Bridge plugin
3. Use the same webhook URL and secret
4. Events will automatically start syncing

### Removing a Site

To stop receiving events from a site:

**Option 1: Disable (Recommended)**
- Deactivate the Webhook Bridge plugin on that site

**Option 2: Remove Data**
```sql
-- Delete all events from a specific source
DELETE FROM events WHERE "sourceUrl" = 'https://site-to-remove.org';

-- This will cascade delete related registrations
```

### Identifying Events by Source

Events are automatically tagged with their source URL. You can:

```javascript
// In your frontend or backend code
const events = await Event.findAll({
  where: {
    sourceUrl: 'https://housesoflight.org'
  }
});
```

## Troubleshooting

### Events Not Syncing from a Site

1. **Check plugin status:**
   - Verify Webhook Bridge plugin is active
   - Verify "Enable webhook notifications" is checked

2. **Test the webhook:**
   - Click "Send Test Webhook" in plugin settings
   - Check if backend receives it

3. **Check WordPress logs:**
   - Enable WordPress debugging
   - Check `/wp-content/debug.log` for errors

4. **Verify connectivity:**
   - Ensure WordPress can reach your backend URL
   - Check firewall rules

### Duplicate Events

If you see duplicate events, check:
- Both sites have different `site_url` values
- Migration was run successfully
- Database constraints are in place

```sql
-- Check for duplicate constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'UNIQUE' 
  AND table_name IN ('events', 'registrations');
```

### Events from Wrong Source

If events appear with incorrect source URLs:
1. Check the WordPress site's actual URL: `Site Address (URL)` in Settings → General
2. The plugin uses WordPress's `get_site_url()` function
3. Ensure it matches your expected URL

## Advanced Configuration

### Custom Source Identification

If you need to override the source URL (e.g., for staging/production):

Edit the plugin to use a custom identifier:
```php
// In mec-webhook-bridge.php, around line 287
$payload = array(
    'event_type' => $event_type,
    'data' => $data,
    'timestamp' => current_time('mysql'),
    'site_url' => defined('CUSTOM_SOURCE_URL') ? CUSTOM_SOURCE_URL : get_site_url()
);
```

Then in `wp-config.php`:
```php
define('CUSTOM_SOURCE_URL', 'https://my-custom-identifier.org');
```

### Site-Specific Webhook URLs

If you need different sites to send to different backends:

1. Configure different webhook URLs in each plugin installation
2. Each backend can have its own database or they can share one
3. Useful for testing environments

## Security Considerations

### Webhook Secret

- Use a strong, random secret (32+ characters)
- Same secret for all sites sending to the same backend
- Store securely in environment variables
- Rotate periodically and update all sites

### Network Security

- Use HTTPS for webhook URLs (required in production)
- Consider IP whitelisting if possible
- Monitor webhook logs for suspicious activity

### Access Control

- Limit WordPress admin access to trusted users only
- Only users with "Manage Options" can configure the plugin
- Audit plugin settings regularly

## Monitoring

### Backend Logs

Monitor webhook activity:
```bash
# Watch logs in real-time
docker-compose logs -f backend | grep webhook

# Filter by source
docker-compose logs backend | grep "housesoflight.org"
```

### Database Monitoring

```sql
-- Events synced in last 24 hours by source
SELECT "sourceUrl", COUNT(*) as recent_events
FROM events
WHERE "lastSyncedAt" > NOW() - INTERVAL '24 hours'
GROUP BY "sourceUrl";

-- Check sync health
SELECT 
  "sourceUrl",
  MAX("lastSyncedAt") as last_sync,
  COUNT(*) as total_events
FROM events
GROUP BY "sourceUrl";
```

## Migration from Single-Site

If you're upgrading from a single-site setup:

1. **Backup your database first!**
   ```bash
   pg_dump mec_events > backup.sql
   ```

2. **Run the migration script:**
   ```bash
   node src/scripts/migrate-multi-site.js
   ```

3. **Verify migration:**
   ```sql
   SELECT COUNT(*), "sourceUrl" FROM events GROUP BY "sourceUrl";
   ```

4. **Deploy updated code:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Test existing functionality:**
   - Check existing events display correctly
   - Verify registrations still work
   - Test check-in functionality

## FAQ

### Q: Can I use this with WordPress Multisite?
A: Yes! Each site in a WordPress Multisite network can have the plugin installed with its own configuration.

### Q: How many sites can I connect?
A: There's no hard limit. The system scales based on your database and backend resources.

### Q: Do events from different sites appear together?
A: Yes, all events appear in the central system. You can filter by `sourceUrl` to separate them.

### Q: What happens if two sites have an event with the same ID?
A: No problem! Events are uniquely identified by `(sourceUrl, mecEventId)`, so they won't conflict.

### Q: Can I sync historical data?
A: Yes, when you install the plugin, it can send webhooks for existing events if MEC triggers the appropriate hooks. Or use the API sync method with `MECService.syncAll(sourceUrl)`.

### Q: How do I handle staging and production sites?
A: Use different webhook URLs for staging and production backends, or use the custom source identification method above.

## Support

For issues or questions:
- Check the main README.md
- Review backend logs: `docker-compose logs backend`
- Check WordPress debug logs
- Verify database constraints are in place

## Best Practices

1. ✅ Test on staging environment first
2. ✅ Run migration during low-traffic period
3. ✅ Backup database before migration
4. ✅ Use HTTPS for webhook URLs
5. ✅ Monitor logs after deployment
6. ✅ Document which sites are connected
7. ✅ Set up alerts for webhook failures
8. ✅ Regularly audit source URLs in database

## Next Steps

After successful multi-site setup:
1. Consider adding source filtering in the frontend
2. Set up monitoring and alerts
3. Document your site sources
4. Train staff on multi-site management
5. Plan for scaling if needed

