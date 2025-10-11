# MEC API Bridge Plugin Installation

This plugin creates a custom REST API endpoint that exposes MEC events with all their metadata, making it easy to sync events to external applications.

## Installation Steps

1. **Upload the Plugin**
   - Upload `mec-api-bridge.php` to your WordPress `/wp-content/plugins/` directory
   - OR create a folder `/wp-content/plugins/mec-api-bridge/` and put the file inside

2. **Activate the Plugin**
   - Go to WordPress Admin > Plugins
   - Find "MEC API Bridge" and click "Activate"

3. **Verify Installation**
   - Test the API endpoint by visiting:
     ```
     https://your-domain.com/wp-json/mec-bridge/v1/events?per_page=5
     ```
   - You should see a JSON response with your MEC events

## API Endpoints

### Get All Events
```
GET /wp-json/mec-bridge/v1/events
```

**Parameters:**
- `per_page` (optional): Number of events to return (default: 100)
- `page` (optional): Page number for pagination (default: 1)
- `start_date` (optional): Filter events starting from this date (YYYY-MM-DD)
- `end_date` (optional): Filter events ending before this date (YYYY-MM-DD)

**Example:**
```bash
curl "https://your-domain.com/wp-json/mec-bridge/v1/events?start_date=2025-10-11&end_date=2026-10-11&per_page=100"
```

### Get Single Event
```
GET /wp-json/mec-bridge/v1/events/{id}
```

**Example:**
```bash
curl "https://your-domain.com/wp-json/mec-bridge/v1/events/12345"
```

## Response Format

Each event includes:
```json
{
  "id": 12345,
  "title": "Event Title",
  "content": "Event description",
  "date": "2025-10-11 12:00:00",
  "modified": "2025-10-10 15:30:00",
  "status": "publish",
  "featured_image": "https://example.com/image.jpg",
  "meta": {
    "mec_start_date": "2025-10-11",
    "mec_end_date": "2025-10-11",
    "mec_start_datetime": "2025-10-11 14:00:00",
    "mec_end_datetime": "2025-10-11 16:00:00",
    "mec_location_id": "123",
    "mec_address": "123 Main St",
    "mec_bookings_limit": "50"
  },
  "time": {
    "start_timestamp": 1728662400,
    "end_timestamp": 1728669600,
    "start_date": "2025-10-11",
    "end_date": "2025-10-11"
  }
}
```

## Configuration

Update your backend `.env` file or `docker-compose.yml` to use the bridge endpoint:

```env
MEC_API_URL=https://your-domain.com
```

The backend will automatically use the `/wp-json/mec-bridge/v1/events` endpoint.

## Features

✅ No authentication required (public read access)  
✅ Includes all MEC metadata fields  
✅ Supports date filtering for upcoming events  
✅ Pagination support  
✅ Returns proper timestamps for date/time fields  
✅ Includes featured images  

## Troubleshooting

**404 Error on API endpoint:**
- Go to WordPress Admin > Settings > Permalinks
- Click "Save Changes" to flush rewrite rules
- Try accessing the endpoint again

**No events returned:**
- Check that you have MEC events with "Publish" status
- Verify the MEC plugin is active
- Check date filters if using them

**Missing metadata:**
- Ensure events have dates set in MEC
- Check that events are properly saved in MEC

## Support

For issues or questions, check the main project README or create an issue in the repository.

