# 🔌 WordPress Plugin Setup Guide

## 📋 Overview

This guide will help you install and configure the MEC Webhook Bridge plugin on your WordPress site to connect with the deployed MEC Events Dashboard.

## 🎯 Plugin Configuration

### Required Information
- **Webhook URL**: `https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec`
- **Webhook Secret**: `juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=`

## 📦 Installation Steps

### 1. Upload Plugin Files

**Option A: Via WordPress Admin (Recommended)**
1. Go to your WordPress admin dashboard
2. Navigate to **Plugins → Add New**
3. Click **Upload Plugin**
4. Upload the `mec-webhook-bridge.php` file
5. Click **Install Now** and then **Activate**

**Option B: Via FTP/SFTP**
1. Upload `mec-webhook-bridge.php` to `/wp-content/plugins/mec-webhook-bridge/`
2. Go to **Plugins** in WordPress admin
3. Find "MEC Webhook Bridge" and click **Activate**

### 2. Configure Plugin Settings

1. Go to **Settings → MEC Webhook Bridge** in your WordPress admin
2. Fill in the following fields:

   **Webhook URL:**
   ```
   https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec
   ```

   **Webhook Secret:**
   ```
   juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=
   ```

   **Enable Webhooks:** ✅ Check this box

3. Click **Save Settings**

### 3. Test the Connection

1. In the plugin settings page, click **Send Test Webhook**
2. You should see a success message: "✅ Test webhook sent successfully"
3. Check the MEC Events Dashboard to verify the test was received

## 🔄 What Gets Synced

The plugin automatically sends webhooks for:

### Events
- ✅ **Event Created/Updated** - When events are saved or published
- ✅ **Event Deleted** - When events are removed
- ✅ **Event Published** - When events go live

### Bookings
- ✅ **Booking Completed** - When someone registers
- ✅ **Booking Confirmed** - When booking is confirmed
- ✅ **Booking Canceled** - When booking is canceled
- ✅ **Attendee Checked In** - When someone checks in

## 🧪 Testing the Integration

### 1. Create a Test Event
1. Go to **MEC → Add Event** in WordPress
2. Create a simple test event with:
   - Title: "Test Event - Plugin Integration"
   - Date: Tomorrow
   - Time: 2:00 PM - 3:00 PM
   - Location: "Test Location"
3. **Publish** the event

### 2. Verify Event Sync
1. Go to your MEC Events Dashboard: https://mec-events-app-hey4v.ondigitalocean.app
2. Login with: `admin@housesoflight.org` / `admin123`
3. Check the **Events** page to see if your test event appears
4. The event should show with `sourceUrl: https://housesoflight.org`

### 3. Test Booking Sync
1. Go to your WordPress site's event page
2. Register for the test event with:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "555-1234"
3. Complete the booking
4. Check the MEC Events Dashboard **Registrations** page
5. Verify the booking appears with the correct details

**Note:** The plugin sends booking data with these field mappings:
- `name` → `attendeeName`
- `email` → `attendeeEmail` 
- `phone` → `attendeePhone`
- `event_id` → Links to the corresponding event

## 🔧 Troubleshooting

### Plugin Not Sending Webhooks

**Check Plugin Settings:**
1. Verify webhook URL is correct
2. Verify webhook secret matches exactly
3. Ensure "Enable Webhooks" is checked
4. Check for any error messages in the settings page

**Check WordPress Logs:**
1. Go to **Tools → Site Health → Info**
2. Check for any PHP errors
3. Look for "MEC Webhook Error" messages in error logs

### Webhook Signature Errors

**Common Issues:**
- Secret key has extra spaces or characters
- URL has trailing slash (should not)
- Plugin is using wrong signature algorithm

**Solution:**
1. Copy the webhook secret exactly: `juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=`
2. Ensure no extra spaces before/after
3. Verify webhook URL has no trailing slash

### Events Not Appearing in Dashboard

**Check:**
1. Is the event published (not draft)?
2. Does the event have a valid date/time?
3. Are there any errors in the browser console?
4. Check the MEC Events Dashboard logs

### Bookings Not Syncing

**Check:**
1. Is the booking completed (not pending)?
2. Does the booking have all required fields?
3. Is the event still published and active?
4. Check for any validation errors

## 📊 Multi-Site Setup

If you have multiple WordPress sites:

1. **Install the plugin on each site**
2. **Use the same webhook URL** for all sites
3. **Use the same webhook secret** for all sites
4. **Each site will send its own `site_url`** in the webhook payload

The MEC Events Dashboard will automatically:
- ✅ Distinguish events from different sites
- ✅ Prevent duplicate events between sites
- ✅ Show the source site for each event/booking

## 🔐 Security Notes

- The webhook secret ensures only your WordPress sites can send data
- All webhook data is transmitted over HTTPS
- The dashboard validates all incoming webhook signatures
- Failed webhook attempts are logged for security monitoring

## 📞 Support

If you encounter issues:

1. **Check the plugin settings** for any error messages
2. **Test the webhook connection** using the test button
3. **Verify your WordPress site** can make outbound HTTPS requests
4. **Check the MEC Events Dashboard logs** for any errors
5. **Ensure Modern Events Calendar** is installed and active

## ✅ Success Checklist

- [ ] Plugin installed and activated
- [ ] Webhook URL configured correctly
- [ ] Webhook secret configured correctly
- [ ] Webhooks enabled
- [ ] Test webhook sent successfully
- [ ] Test event created and synced
- [ ] Test booking created and synced
- [ ] Events appear in MEC Events Dashboard
- [ ] Bookings appear in MEC Events Dashboard

---

**🎉 Once all items are checked, your WordPress site is fully integrated with the MEC Events Dashboard!**
