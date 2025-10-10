# Changelog

## [1.1.0] - 2025-10-10 - Multi-Site Support

### 🎉 New Features

#### Multi-Site Support
- **Multiple WordPress Sites**: Install the webhook plugin on multiple WordPress sites to aggregate events
- **Unique Identification**: Events and bookings are uniquely identified by (sourceUrl, mecEventId/mecBookingId)
- **No Conflicts**: Events with same ID from different sites won't conflict
- **Source Tracking**: Every event and registration tracks its originating WordPress site

### 📝 Changes

#### Database Schema
- **Events Table**:
  - Added `sourceUrl` column (required)
  - Updated unique constraint to composite: `(sourceUrl, mecEventId)`
  - Added index on `sourceUrl`

- **Registrations Table**:
  - Added `sourceUrl` column (required)
  - Updated unique constraint to composite: `(sourceUrl, mecBookingId)`
  - Added index on `sourceUrl`

#### Backend Updates
- **Event Model** (`backend/src/models/Event.js`):
  - Added `sourceUrl` field
  - Updated indexes and constraints

- **Registration Model** (`backend/src/models/Registration.js`):
  - Added `sourceUrl` field
  - Updated indexes and constraints

- **Webhook Controller** (`backend/src/controllers/webhookController.js`):
  - All webhook handlers now properly handle `site_url` from payload
  - Events and bookings are matched by both `sourceUrl` and ID
  - Enhanced logging to show source URL

- **MEC Service** (`backend/src/services/mecService.js`):
  - Added optional `sourceUrl` parameter to all sync methods
  - API-based sync now supports multi-site (with explicit source URL)

#### WordPress Plugin
- **Documentation Updated** (`wordpress-plugin/README.md`):
  - Added multi-site installation instructions
  - Explained how multi-site identification works
  - Setup guide for multiple sites

#### Scripts
- **Migration Script** (`backend/src/scripts/migrate-multi-site.js`):
  - Automated database migration for existing deployments
  - Adds `sourceUrl` columns
  - Updates constraints and indexes
  - Migrates existing data with default source URL

### 📚 Documentation

#### New Files
- **MULTI-SITE-SETUP.md**: Comprehensive guide for multi-site configuration
  - Architecture overview
  - Step-by-step setup instructions
  - Troubleshooting guide
  - Best practices
  - Security considerations

#### Updated Files
- **README.md**: 
  - Added multi-site support to features list
  - WordPress integration section
  - Updated prerequisites
  - Migration script documentation

- **DEPLOYMENT.md**:
  - Multi-site deployment steps
  - Migration instructions
  - Environment variable updates
  - Multi-site verification checklist

- **wordpress-plugin/README.md**:
  - Multi-site installation guide
  - How multi-site works section

### 🔧 Configuration

#### New Environment Variables
```env
# Required for multi-site support
WEBHOOK_SECRET=your-webhook-secret-change-in-production
DEFAULT_SOURCE_URL=https://housesoflight.org  # Used for migration
```

### 🚀 Migration Guide

For existing deployments:

```bash
# 1. Backup database first!
docker-compose exec postgres pg_dump -U postgres mec_dashboard > backup.sql

# 2. Set DEFAULT_SOURCE_URL in .env
echo "DEFAULT_SOURCE_URL=https://housesoflight.org" >> backend/.env

# 3. Run migration
docker-compose exec backend node src/scripts/migrate-multi-site.js

# 4. Deploy updated code
docker-compose down
docker-compose up -d --build
```

### ✅ Installation on Additional Sites

To add events from a new WordPress site:

1. Install MEC Webhook Bridge plugin on the new site
2. Configure with same webhook URL and secret
3. Enable webhooks
4. Events automatically sync with proper source identification

### 🔒 Security Notes

- Same `WEBHOOK_SECRET` must be used across all WordPress sites
- Each webhook payload is signed with HMAC SHA-256
- Source URL is automatically extracted from WordPress's `get_site_url()`
- All webhook communication should use HTTPS in production

### 📊 Database Impact

- Two new columns added (one per table)
- New indexes created for performance
- Existing unique constraints replaced with composite constraints
- Minimal performance impact - properly indexed

### 🎯 Benefits

1. **Centralized Management**: Manage events from multiple WordPress sites in one dashboard
2. **No Conflicts**: Different sites can have events with same ID
3. **Flexible Architecture**: Add/remove sites without code changes
4. **Real-time Sync**: Webhooks ensure instant synchronization
5. **Scalable**: No limit on number of sites (within database capacity)

### 🐛 Bug Fixes

- Fixed event/booking uniqueness to work across multiple sites
- Ensured webhook handlers use correct source matching

### ⚠️ Breaking Changes

**For existing deployments without migration:**
- Events table requires `sourceUrl` column
- Registrations table requires `sourceUrl` column
- Unique constraints have changed

**Migration is required** if upgrading from pre-multi-site version.

### 🔄 Backwards Compatibility

- Single-site deployments continue to work (just specify one source URL)
- API sync method still supported alongside webhooks
- All existing endpoints remain unchanged
- No frontend changes required

### 📦 What's Included

- ✅ Database migration script
- ✅ Updated models and controllers
- ✅ Multi-site setup guide
- ✅ Updated deployment documentation
- ✅ WordPress plugin documentation
- ✅ All tests passing
- ✅ No linter errors

### 🎓 Learning Resources

- [MULTI-SITE-SETUP.md](MULTI-SITE-SETUP.md) - Complete setup guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [wordpress-plugin/README.md](wordpress-plugin/README.md) - Plugin docs

---

## Previous Versions

### [1.0.0] - 2025-10-10 - Initial Release

- Full-stack MEC event management system
- Dashboard with analytics
- QR code check-in
- Email notifications
- PDF/CSV exports
- WordPress webhook integration
- Docker deployment

---

**Built with ❤️ for event management**

