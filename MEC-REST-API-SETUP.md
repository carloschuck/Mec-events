# MEC REST API Integration Setup Guide

This guide explains how to set up and use the Modern Events Calendar (MEC) REST API integration with the MEC Events App.

## Overview

The MEC REST API integration allows you to:
- Fetch events from WordPress sites running MEC
- Sync event data to the centralized dashboard
- Access booking information and attendee data
- Manage events across multiple WordPress installations

## Prerequisites

1. **Modern Events Calendar Plugin**: Installed and activated on your WordPress site
2. **MEC REST API Feature**: The REST API feature must be enabled in MEC settings
3. **WordPress REST API**: Enabled (default in WordPress 4.7+)
4. **API Authentication**: Configured with appropriate API keys

## WordPress Setup

### 1. Enable MEC REST API

1. Go to **MEC Settings > REST API** in your WordPress admin
2. Enable the REST API feature by checking "Enable REST API"
3. The API will be available at: `https://your-site.com/wp-json/mec/v1.0/`

### 2. Configure API Keys

1. In **MEC Settings > REST API**, go to the "API Keys" section
2. Add a new API key:
   - **Name**: Give it a descriptive name (e.g., "MEC Events App")
   - **Key**: Generate a unique API key
   - **Permissions**: Set appropriate permissions
3. Save the API key - you'll need it for backend configuration

### 3. API Endpoints

The MEC REST API provides these endpoints:

```
Base URL: https://your-wordpress-site.com/wp-json/mec/v1.0/

Endpoints:
- GET /events - List all events
- GET /events/{id} - Get specific event
- GET /events/{id}/tickets - Get event tickets
- GET /events/{id}/fees - Get event fees
- POST /login - User authentication
- GET /config/custom-fields - Get custom fields
- GET /config/attendee-fields - Get attendee fields
- GET /config/fixed-fields - Get fixed fields
- GET /config/ticket-variations - Get ticket variations
- GET /config/icons - Get available icons
```

### 4. Authentication

MEC REST API uses token-based authentication:

- **Header**: `mec-token: your-api-key`
- **Required**: For all API requests
- **Optional**: `mec-user` header for user-specific requests

## Backend Configuration

### 1. Environment Variables

Add these environment variables to your backend configuration:

```bash
# MEC API Configuration
MEC_API_URL=https://your-wordpress-site.com
MEC_API_KEY=your-api-key-here
```

### 2. API Integration

The backend includes a `mecApiController.js` that handles:

- **Authentication**: Manages API tokens
- **Data Fetching**: Retrieves events from MEC
- **Data Transformation**: Converts MEC data to our database format
- **Error Handling**: Manages API errors and rate limiting

### 3. Sync Process

The sync process works as follows:

1. **Fetch Events**: Retrieve events from MEC API using `/events` endpoint
2. **Transform Data**: Convert MEC event format to our database schema
3. **Store Events**: Save events to our PostgreSQL database
4. **Handle Conflicts**: Use `sourceUrl` and `mecEventId` for uniqueness
5. **Update Metadata**: Store original MEC data in metadata field

## Usage

### 1. Test API Connection

Test the MEC API connection:

```bash
curl -X GET https://your-app.com/api/mec-api/test
```

### 2. Get Events

Fetch events from MEC API:

```bash
curl -X GET "https://your-app.com/api/mec-api/events?limit=10&start_date_type=today" \
  -H "Content-Type: application/json"
```

### 3. Get Single Event

Fetch a specific event:

```bash
curl -X GET https://your-app.com/api/mec-api/events/123 \
  -H "Content-Type: application/json"
```

### 4. Get Event Tickets

Fetch event tickets:

```bash
curl -X GET https://your-app.com/api/mec-api/events/123/tickets \
  -H "Content-Type: application/json"
```

### 5. Sync Events

Sync events from MEC API to local database:

```bash
curl -X POST https://your-app.com/api/mec-api/sync/events \
  -H "Content-Type: application/json"
```

## Data Mapping

### Event Data Mapping

| MEC Field | Our Database Field | Notes |
|-----------|-------------------|-------|
| `id` | `mecEventId` | MEC event ID |
| `title` | `title` | Event title |
| `content` | `description` | Event description |
| `start.date` | `startDate` | Event start date |
| `end.date` | `endDate` | Event end date |
| `location.name` | `location` | Event location |
| `location.address` | `address` | Event address |
| `meta.mec_booking.bookings_limit` | `capacity` | Event capacity |
| `thumbnail` | `imageUrl` | Event image |
| `status` | `status` | Event status |
| `*` | `metadata` | Full MEC event data |

### Query Parameters

The MEC API supports these query parameters for `/events`:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | number | Number of events to return | `limit=12` |
| `offset` | number | Number of events to skip | `offset=0` |
| `start_date_type` | string | Start date filter type | `today`, `date` |
| `start_date` | string | Start date (if type=date) | `2024-01-01` |
| `end_date_type` | string | End date filter type | `date` |
| `end_date` | string | End date | `2024-12-31` |
| `order` | string | Sort order | `ASC`, `DESC` |
| `keyword` | string | Search keyword | `conference` |
| `categories` | string | Category filter | `1,2,3` |
| `locations` | string | Location filter | `1,2,3` |
| `organizers` | string | Organizer filter | `1,2,3` |
| `labels` | string | Label filter | `1,2,3` |
| `tags` | string | Tag filter | `1,2,3` |

## Error Handling

### Common Issues

1. **Authentication Errors (401)**
   - Verify API key is correct
   - Check API key permissions in MEC settings
   - Ensure REST API is enabled

2. **Not Found Errors (404)**
   - Verify WordPress site URL
   - Check if MEC plugin is active
   - Ensure REST API endpoints are available

3. **Rate Limiting (429)**
   - Implement exponential backoff
   - Use appropriate request intervals
   - Monitor API usage

### Debugging

Enable debug logging:

```bash
DEBUG=mec-api npm start
```

Check logs for:
- API request/response details
- Authentication status
- Data transformation issues
- Error messages and stack traces

## Security Considerations

1. **API Key Security**
   - Store API keys securely in environment variables
   - Never commit API keys to version control
   - Rotate keys regularly

2. **HTTPS Only**
   - Always use HTTPS for API calls
   - Validate SSL certificates
   - Implement certificate pinning

3. **Input Validation**
   - Validate all API inputs
   - Sanitize data before storage
   - Implement rate limiting

## Troubleshooting

### API Connection Issues

1. **Check WordPress Site**
   - Ensure MEC plugin is active
   - Verify REST API is enabled in MEC settings
   - Test API endpoints manually: `https://your-site.com/wp-json/mec/v1.0/events`

2. **Check Backend Configuration**
   - Verify `MEC_API_URL` environment variable
   - Verify `MEC_API_KEY` environment variable
   - Test API key validity

3. **Check Logs**
   - Review backend logs for API errors
   - Check WordPress error logs
   - Monitor API response codes

### Data Sync Issues

1. **Missing Events**
   - Check API permissions
   - Verify event status (published vs draft)
   - Review date filters and query parameters

2. **Incorrect Data**
   - Validate data mapping
   - Check field transformations
   - Review metadata storage

3. **Duplicate Events**
   - Verify unique constraints on `sourceUrl` and `mecEventId`
   - Check sourceUrl configuration
   - Review sync logic

## Best Practices

1. **Incremental Sync**
   - Use date filters for incremental updates
   - Implement change detection
   - Store last sync timestamp

2. **Error Recovery**
   - Implement retry logic with exponential backoff
   - Handle partial failures gracefully
   - Maintain sync state

3. **Performance**
   - Use pagination for large datasets
   - Implement caching where appropriate
   - Monitor API response times

4. **Monitoring**
   - Track sync success rates
   - Monitor API usage and rate limits
   - Set up alerts for failures

## Example Integration

Here's a complete example of how to use the MEC API integration:

```javascript
// Test connection
const testResponse = await fetch('/api/mec-api/test');
const testResult = await testResponse.json();
console.log('Connection test:', testResult);

// Get events
const eventsResponse = await fetch('/api/mec-api/events?limit=10&start_date_type=today');
const eventsResult = await eventsResponse.json();
console.log('Events:', eventsResult.data.events);

// Sync events to database
const syncResponse = await fetch('/api/mec-api/sync/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const syncResult = await syncResponse.json();
console.log('Sync result:', syncResult);
```

## Support

For issues with:
- **MEC Plugin**: Contact Webnus support
- **REST API**: Check MEC documentation
- **Integration Issues**: Review this guide and check logs