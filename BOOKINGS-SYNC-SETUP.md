# Bookings/Registration Sync Setup Guide

## Overview
This guide explains how to sync bookings/registrations from Modern Events Calendar (MEC) to your MEC Events application.

## Prerequisites
- WordPress site with MEC plugin installed
- MEC Booking addon activated
- Updated MEC API Bridge plugin installed

## Step 1: Update WordPress Plugin

1. **Download the updated plugin**: `wordpress-plugin/mec-api-bridge-with-bookings.zip`

2. **Install on WordPress**:
   - Go to WordPress Admin → Plugins → Add New
   - Click "Upload Plugin"
   - Choose `mec-api-bridge-with-bookings.zip`
   - Click "Install Now"
   - Activate the plugin

3. **Flush Permalinks**:
   - Go to Settings → Permalinks
   - Click "Save Changes" (even without making changes)

## Step 2: Verify API Endpoints

Test that the new endpoints are working:

### Test Bookings Endpoint
```bash
curl https://housesoflight.org/wp-json/mec-bridge/v1/bookings
```

### Test Event-Specific Bookings
```bash
curl https://housesoflight.org/wp-json/mec-bridge/v1/events/{EVENT_ID}/bookings
```

## Step 3: Sync Bookings to Your App

### Trigger Manual Sync

#### Local Development:
```bash
curl -X POST http://localhost:3001/api/mec-api/sync/bookings
```

#### Production:
```bash
curl -X POST https://mec-events-app-hey4v.ondigitalocean.app/api/mec-api/sync/bookings
```

### Response Format
```json
{
  "success": true,
  "message": "Bookings sync completed",
  "data": {
    "total": 25,
    "synced": 25,
    "errors": 0
  }
}
```

## Step 4: Verify Synced Registrations

After syncing, verify the data in your app:

### Check Registrations for a Specific Event
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://mec-events-app-hey4v.ondigitalocean.app/api/registrations?eventId=EVENT_ID
```

### Check All Registrations
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://mec-events-app-hey4v.ondigitalocean.app/api/registrations
```

## Automated Sync

The booking sync is **not** included in the automatic cron job by default to avoid unnecessary API calls. However, you can add it to the cron if needed.

### Option 1: Add to Existing Cron Job

Edit `backend/src/cron/jobs.js` and modify the `scheduleMECSync` function to include booking sync.

### Option 2: Create a Separate Booking Sync Schedule

Add a new cron job specifically for bookings:

```javascript
scheduleBookingSync() {
  const schedule = process.env.BOOKING_SYNC_CRON_SCHEDULE || '0 */6 * * *'; // Every 6 hours
  
  const job = cron.schedule(schedule, async () => {
    console.log('🔄 Running scheduled booking sync...');
    try {
      // Call the booking sync logic here
      console.log('✅ Scheduled booking sync completed');
    } catch (error) {
      console.error('❌ Error in scheduled booking sync:', error.message);
    }
  });

  this.jobs.push(job);
  console.log(`📅 Booking sync scheduled: ${schedule}`);
}
```

## Troubleshooting

### Issue: "MEC bookings table not found"

**Cause**: The MEC booking addon is not installed or not activated.

**Solution**: 
1. Install and activate the MEC Booking addon in WordPress
2. Ensure bookings are enabled in MEC settings

### Issue: Bookings synced but no event found

**Cause**: Events haven't been synced yet or event IDs don't match.

**Solution**:
1. Sync events first: `POST /api/mec-api/sync/events`
2. Then sync bookings: `POST /api/mec-api/sync/bookings`

### Issue: Booking data is incomplete

**Cause**: MEC stores booking data in a specific format that varies by configuration.

**Solution**: Check the `raw_booking` field in the metadata to see the original booking structure, then update the `format_booking_data` function in the WordPress plugin if needed.

## API Reference

### WordPress Endpoints (MEC Bridge API)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wp-json/mec-bridge/v1/bookings` | GET | Get all bookings |
| `/wp-json/mec-bridge/v1/bookings?event_id=123` | GET | Get bookings for specific event |
| `/wp-json/mec-bridge/v1/events/{id}/bookings` | GET | Get bookings for event by ID |

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mec-api/sync/bookings` | POST | Sync all bookings from MEC |
| `/api/registrations` | GET | Get all registrations (requires auth) |
| `/api/registrations?eventId=123` | GET | Get registrations for specific event |

## Next Steps

1. **Push changes to production**: `git push`
2. **Update WordPress plugin** on your live site
3. **Trigger booking sync** on production
4. **Verify data** in your frontend application
5. **(Optional)** Set up automated booking sync cron job

## Support

If you encounter issues:
1. Check the backend logs for error messages
2. Test the WordPress endpoints directly with curl
3. Verify MEC booking addon is properly configured
4. Check that events are synced before attempting to sync bookings

