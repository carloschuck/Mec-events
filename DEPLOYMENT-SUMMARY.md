# MEC Events App - Deployment Summary

## 🎉 Deployment Status: IN PROGRESS

Your MEC Events application has been successfully deployed to DigitalOcean App Platform!

### App Information
- **App Name**: mec-events-app
- **App ID**: `a72e86c7-1cad-4633-a09a-2ec2a4365a45`
- **Region**: San Francisco (sfo3)
- **Current Status**: Building
- **Dashboard**: https://cloud.digitalocean.com/apps/a72e86c7-1cad-4633-a09a-2ec2a4365a45

### App URL
Your app will be available at a URL like:
```
https://mec-events-app-xxxxx.ondigitalocean.app
```

You can find the exact URL in your DigitalOcean dashboard once the deployment completes (usually 5-10 minutes).

---

## 📦 What Was Deployed

### Services
1. **Backend** (Node.js + Express)
   - Instance: basic-xxs (minimum size as requested)
   - Path: `/api`
   - Health Check: `/api/health`
   - Auto-deploy: Enabled (on push to `main` branch)

2. **Frontend** (React + Vite)
   - Instance: basic-xxs (minimum size as requested)
   - Path: `/`
   - Auto-deploy: Enabled (on push to `main` branch)

3. **Database** (PostgreSQL 15)
   - Dev database (automatically provisioned)
   - Credentials automatically injected into backend

---

## 🔐 Security Configuration

The following secrets have been configured:

| Secret | Purpose |
|--------|---------|
| JWT_SECRET | Authentication token signing |
| WEBHOOK_SECRET | WordPress webhook verification |
| DB_PASSWORD | Database access |

**⚠️ IMPORTANT**: Save your webhook secret for WordPress configuration:
```
juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=
```

---

## 🌐 Environment Variables Configured

✅ **Database** (Auto-configured)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

✅ **Application**
- `NODE_ENV`: production
- `PORT`: 5000
- `JWT_EXPIRES_IN`: 7d
- `ORG_NAME`: Houses of Light

✅ **Multi-Site Support**
- `DEFAULT_SOURCE_URL`: https://housesoflight.org
- `WEBHOOK_SECRET`: ✓ Configured

✅ **WordPress Integration**
- `MEC_API_URL`: https://housesoflight.org/wp-json/mec/v1.0

✅ **Cron Jobs**
- `SYNC_CRON_SCHEDULE`: 0 */3 * * * (every 3 hours)
- `REMINDER_CRON_SCHEDULE`: 0 9 * * * (9 AM daily)

❌ **SMTP Email** (Not configured - optional)
- You can add these later in Settings > Environment Variables:
  - `SMTP_HOST` (e.g., smtp.gmail.com)
  - `SMTP_PORT` (e.g., 587)
  - `SMTP_USER` (your email)
  - `SMTP_PASS` (your app password)
  - `EMAIL_FROM` (sender email)

---

## 📋 Next Steps

### 1. Wait for Deployment to Complete
Monitor the deployment progress:
```bash
# Check via DigitalOcean dashboard
https://cloud.digitalocean.com/apps/a72e86c7-1cad-4633-a09a-2ec2a4365a45

# The build typically takes 5-10 minutes
```

### 2. Create Admin User
Once deployed, create your first admin user:

```bash
# SSH into your app or use the console
# Option 1: Via DigitalOcean Console (recommended)
# Go to: Apps > mec-events-app > backend > Console

# Then run:
npm run seed
```

This will create:
- **Username**: admin@housesoflight.org
- **Password**: Admin123!

**⚠️ Change this password immediately after first login!**

### 3. Configure WordPress Webhooks

#### Install the Plugin
1. Upload `wordpress-plugin/mec-webhook-bridge.php` to your WordPress site
2. Go to **Plugins** > **Installed Plugins**
3. Activate "MEC Webhook Bridge"

#### Configure Settings
Go to **Settings** > **MEC Webhook Bridge** and configure:

```
Webhook Endpoint URL:
https://your-app-url.ondigitalocean.app/api/webhook/mec

Webhook Secret:
juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=

✅ Enable Event Webhooks
✅ Enable Booking Webhooks
```

#### Test the Connection
Click "Test Connection" button in the plugin settings to verify webhooks are working.

### 4. Verify Database Connection
After deployment, check that the database is properly connected:

```bash
# Via the backend console:
npm run db:status

# Or check the health endpoint:
curl https://your-app-url.ondigitalocean.app/api/health
```

### 5. Multi-Site Configuration (Optional)
To add additional WordPress sites:

1. Install the webhook plugin on each site
2. Configure with the same webhook endpoint and secret
3. Each site's events will be automatically tagged with its source URL

See `MULTI-SITE-SETUP.md` for detailed instructions.

### 6. Add SMTP Settings (Optional)
To enable email reminders:

1. Go to DigitalOcean dashboard > Apps > mec-events-app
2. Click **Settings** > **Environment Variables**
3. Add SMTP configuration variables (see list above)
4. Redeploy the app

---

## 🎯 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **App Dashboard** | https://cloud.digitalocean.com/apps/a72e86c7-1cad-4633-a09a-2ec2a4365a45 | Manage your app |
| **Frontend** | https://your-app-url.ondigitalocean.app | User interface |
| **Backend API** | https://your-app-url.ondigitalocean.app/api | API endpoints |
| **Health Check** | https://your-app-url.ondigitalocean.app/api/health | Service status |
| **Webhook Endpoint** | https://your-app-url.ondigitalocean.app/api/webhook/mec | WordPress webhooks |

---

## 🔍 Monitoring & Logs

### View Logs
```bash
# Via DigitalOcean Dashboard:
Apps > mec-events-app > Runtime Logs

# Filter by service:
- backend: Application logs
- frontend: Nginx logs
- mec-postgres-db: Database logs
```

### Common Issues

#### Build Failures
If the build fails, check:
1. Docker files are correctly configured
2. All dependencies are in package.json
3. Node version matches (18.x)

#### Health Check Failures
If health checks fail:
1. Verify `/api/health` endpoint exists
2. Check database connection
3. Review backend logs for errors

#### Database Connection Issues
If database won't connect:
1. Check environment variables are set
2. Verify database is provisioned (check Components tab)
3. Restart the backend service

---

## 📊 Database Information

### About Dev Databases
⚠️ **Note**: We deployed with a **dev database** because DigitalOcean App Platform doesn't support creating production database clusters through the app spec.

**Dev Database Characteristics:**
- Automatically provisioned
- Included in app's basic tier pricing
- Suitable for testing and small-scale production
- **Data persists** across deployments
- No manual backups (use exports)

### Upgrading to Production Database Cluster
For high availability and better performance, you can migrate to a managed database cluster:

1. **Create a Database Cluster**:
   - Go to: https://cloud.digitalocean.com/databases
   - Create new PostgreSQL 15 cluster in San Francisco (SFO3)
   - Choose your preferred size (minimum: db-s-1vcpu-1gb)

2. **Export Current Data**:
   ```bash
   # From backend console
   npm run db:export > backup.sql
   ```

3. **Update App Settings**:
   - Go to Apps > mec-events-app > Settings > Environment Variables
   - Update database variables to point to new cluster
   - Redeploy

4. **Import Data**:
   ```bash
   # Connect to new database and import
   psql -h new-cluster-host -U doadmin -d mec_dashboard < backup.sql
   ```

---

## 🚀 Auto-Deployment

Your app is configured for **continuous deployment**:
- Any push to the `main` branch will automatically trigger a new deployment
- You'll receive email notifications about deployment status
- Rollback to previous deployments anytime from the dashboard

---

## 💰 Cost Estimate

**Monthly Cost (Minimum Configuration)**:
- Backend (basic-xxs): ~$5/month
- Frontend (basic-xxs): ~$5/month
- Dev Database: Included
- **Total**: ~$10/month

To see exact pricing, visit: https://www.digitalocean.com/pricing/app-platform

---

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Project README](./README.md)
- [Multi-Site Setup Guide](./MULTI-SITE-SETUP.md)
- [Local Testing Guide](./LOCAL-TESTING-GUIDE.md)
- [Commands Reference](./COMMANDS.md)

---

## 🆘 Need Help?

1. **Check Deployment Logs**: Most issues can be diagnosed from the runtime logs
2. **Review Documentation**: See the guides in this repository
3. **Database Connection**: Verify all DB_* environment variables are set correctly
4. **Webhooks Not Working**: Verify webhook secret matches in both WordPress and backend

---

**Deployment Date**: October 10, 2025
**Deployed By**: carloschuck@housesoflight.org
**Repository**: https://github.com/carloschuck/Mec-events

