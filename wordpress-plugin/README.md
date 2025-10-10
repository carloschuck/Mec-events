# MEC Webhook Bridge Plugin

A WordPress plugin that sends Modern Events Calendar (MEC) event and booking data to external webhook endpoints in real-time.

## Features

- ✅ Real-time event synchronization
- ✅ Booking notifications (completed, canceled, confirmed)
- ✅ Attendee check-in tracking
- ✅ Secure webhook signing with HMAC SHA-256
- ✅ Test webhook functionality
- ✅ Easy WordPress admin configuration

## Installation

### Step 1: Upload Plugin to WordPress

1. **Via FTP/File Manager:**
   - Upload the entire `mec-webhook-bridge` folder to `/wp-content/plugins/`
   - Or upload the `mec-webhook-bridge.php` file directly to `/wp-content/plugins/`

2. **Via WordPress Admin:**
   - Go to `Plugins → Add New → Upload Plugin`
   - Upload the plugin ZIP file
   - Click `Install Now`

### Step 2: Activate Plugin

1. Go to `Plugins → Installed Plugins` in your WordPress admin
2. Find "MEC Webhook Bridge"
3. Click `Activate`

### Step 3: Configure Plugin

1. Go to `Settings → MEC Webhook Bridge`
2. Enter your webhook URL:
   ```
   http://localhost:3001/api/webhooks/mec
   ```
   (Use your production URL when deploying)

3. Enter a webhook secret (must match your backend configuration):
   ```
   your-webhook-secret-key-change-in-production
   ```

4. Check "Enable webhook notifications"
5. Click `Save Changes`

### Step 4: Test Webhook

1. In the settings page, click `Send Test Webhook`
2. You should see a success message
3. Check your backend logs to confirm receipt

## Webhook Events

The plugin sends webhooks for the following events:

### Event Webhooks
- `event.saved` - When an event is created or updated
- `event.published` - When an event is published
- `event.deleted` - When an event is deleted

### Booking Webhooks
- `booking.completed` - When a booking is completed
- `booking.confirmed` - When a booking is confirmed
- `booking.canceled` - When a booking is canceled

### Attendee Webhooks
- `attendee.checked_in` - When an attendee is checked in

## Webhook Payload Format

```json
{
  "event_type": "booking.completed",
  "data": {
    "booking_id": 123,
    "booking_data": {
      "id": 123,
      "event_id": 456,
      "name": "John Doe",
      "email": "john@example.com",
      "tickets": 2,
      "date": "2025-10-10 14:30:00"
    }
  },
  "timestamp": "2025-10-10 14:30:00",
  "site_url": "https://housesoflight.org"
}
```

## Security

### Webhook Signature Verification

Each webhook includes an `X-MEC-Signature` header containing an HMAC SHA-256 signature:

```
X-MEC-Signature: abc123def456...
```

Your backend should verify this signature to ensure the webhook is authentic:

```javascript
const crypto = require('crypto');

const signature = req.headers['x-mec-signature'];
const payload = JSON.stringify(req.body);
const secret = 'your-webhook-secret';

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  // Invalid signature - reject webhook
}
```

## Troubleshooting

### Webhooks Not Being Sent

1. **Check if plugin is activated:**
   - Go to `Plugins → Installed Plugins`
   - Ensure "MEC Webhook Bridge" is active

2. **Check if webhooks are enabled:**
   - Go to `Settings → MEC Webhook Bridge`
   - Ensure "Enable webhook notifications" is checked

3. **Check WordPress error logs:**
   - Look for errors in `/wp-content/debug.log` (if WP_DEBUG is enabled)

4. **Test webhook manually:**
   - Use the "Send Test Webhook" button in settings
   - Check if your endpoint receives the test data

### Webhook URL Not Reachable

- Ensure your backend is running and accessible
- Check firewall rules
- For local development, ensure `localhost:3001` is accessible from WordPress
- For production, use your public domain URL

## Requirements

- WordPress 5.0 or higher
- Modern Events Calendar (MEC) plugin installed and activated
- PHP 7.4 or higher

## Support

For issues or questions:
- Check the plugin settings page
- Review WordPress error logs
- Test webhook endpoint manually

## License

GPL v2 or later

## Changelog

### Version 1.0.0
- Initial release
- Event webhooks (created, published, deleted)
- Booking webhooks (completed, confirmed, canceled)
- Attendee check-in webhooks
- Webhook signature verification
- Admin settings page
- Test webhook functionality

