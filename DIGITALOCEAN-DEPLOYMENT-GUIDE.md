# DigitalOcean App Platform Deployment Guide

Complete guide to deploying the MEC Events system to DigitalOcean App Platform with a PostgreSQL database cluster.

## 🎯 What You'll Deploy

- **Backend Service** (Basic XXS - $5/month) - Node.js API
- **Frontend Service** (Basic XXS - $5/month) - React SPA
- **PostgreSQL Database** (Basic Dev - $7/month) - Managed database cluster
- **Total Minimum Cost: ~$17/month**

## 📋 Prerequisites

1. ✅ GitHub account with repository: `Mec-events`
2. ✅ DigitalOcean account ([Sign up here](https://www.digitalocean.com))
3. ✅ Payment method added to DigitalOcean
4. ✅ Gmail with App Password (for email notifications)

## 🚀 Deployment Steps

### Step 1: Prepare App Spec File

1. **Update GitHub username** in `.do/app.yaml`:
   - Replace `yourgithubusername` with your actual GitHub username (3 places)

2. **Update email settings** in `.do/app.yaml`:
   ```yaml
   - key: SMTP_USER
     value: your-actual-email@gmail.com
   - key: SMTP_PASS
     value: your-gmail-app-password
   - key: EMAIL_FROM
     value: MEC Dashboard <your-actual-email@gmail.com>
   ```

3. **Generate secrets**:
   ```bash
   # Generate JWT secret (32 characters)
   openssl rand -base64 32
   
   # Generate webhook secret (32 characters)
   openssl rand -base64 32
   ```
   Update in `.do/app.yaml`:
   ```yaml
   - key: JWT_SECRET
     value: <paste-generated-jwt-secret>
   - key: WEBHOOK_SECRET
     value: <paste-generated-webhook-secret>
   ```

4. **Commit and push changes**:
   ```bash
   git add .do/app.yaml
   git commit -m "Configure DigitalOcean deployment"
   git push origin main
   ```

### Step 2: Create App on DigitalOcean

#### Option A: Deploy via App Spec File (Recommended)

1. **Log in to DigitalOcean**
   - Go to https://cloud.digitalocean.com

2. **Create New App**
   - Click "Apps" in left sidebar
   - Click "Create App"

3. **Choose Source**
   - Select "GitHub"
   - Authorize DigitalOcean to access your GitHub
   - Select repository: `Mec-events`
   - Select branch: `main`
   - **Check**: "Autodeploy on push"
   - Click "Next"

4. **Import App Spec**
   - Click "Edit App Spec"
   - Paste contents of `.do/app.yaml`
   - Click "Save"

5. **Review Configuration**
   - Verify all services are listed:
     - ✅ PostgreSQL Database (mec-db)
     - ✅ Backend Service
     - ✅ Frontend Service
     - ✅ DB Setup Job
   - Click "Next"

6. **Choose Region**
   - Select: **San Francisco (SFO3)**
   - Click "Next"

7. **Review and Deploy**
   - Review pricing: ~$17/month minimum
   - Click "Create Resources"

#### Option B: Manual Configuration (Alternative)

If you prefer to configure manually through the UI:

1. **Create Database First**
   - Go to "Databases" → "Create Database Cluster"
   - Choose: PostgreSQL 15
   - Select: Basic plan, $7/month
   - Region: San Francisco 3
   - Database name: `mec-db`
   - Click "Create Database Cluster"

2. **Create App**
   - Go to "Apps" → "Create App"
   - Connect to GitHub repository
   - Configure services manually (follow app.yaml as reference)

### Step 3: Monitor Deployment

1. **Watch Build Progress**
   - You'll see 3 components building:
     - Backend (takes ~5-10 minutes)
     - Frontend (takes ~3-5 minutes)
     - Database (takes ~2-3 minutes)

2. **Check Database Connection**
   - Once backend is built, check logs:
   - Go to "Runtime Logs" for backend
   - Look for: `✅ Database connection established`

3. **Wait for Post-Deploy Job**
   - The `db-setup` job will run automatically
   - This seeds the database with initial data
   - Check job logs for: `✅ Database seeded successfully`

### Step 4: Configure Database Connection (If Using Manual Setup)

If you created the database separately:

1. **Get Database Credentials**
   - Go to your database cluster
   - Click "Connection Details"
   - Note: host, port, username, password, database name

2. **Add to Backend Environment Variables**
   - Go to your App → Settings → Backend component
   - Add/Update environment variables:
     ```
     DB_HOST=<database-host>
     DB_PORT=25060
     DB_NAME=defaultdb
     DB_USER=doadmin
     DB_PASSWORD=<database-password>
     ```

3. **Trigger Redeploy**
   - Go to "Settings" → "App-Level Settings"
   - Click "Deploy" → "Deploy Current Spec"

### Step 5: Post-Deployment Configuration

#### 5.1 Note Your URLs

After deployment completes:

1. **Frontend URL**: `https://mec-events-xxxxx.ondigitalocean.app`
2. **Backend URL**: `https://mec-events-xxxxx-backend.ondigitalocean.app`

#### 5.2 Update CLIENT_URL

1. Go to Backend service → Settings → Environment Variables
2. Update `CLIENT_URL` to your frontend URL
3. Click "Save"
4. Redeploy the backend

#### 5.3 Test the Deployment

```bash
# Test backend health
curl https://mec-events-xxxxx-backend.ondigitalocean.app/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-10T..."}
```

#### 5.4 Access the Dashboard

1. **Open your frontend URL** in browser
2. **Login with demo credentials**:
   - Email: `admin@example.com`
   - Password: `admin123`

3. **⚠️ IMPORTANT: Change admin password immediately!**
   - Go to Profile → Change Password

### Step 6: Configure WordPress Plugin

Now configure your WordPress site(s) to send webhooks:

1. **Install WordPress Plugin**
   - Upload `wordpress-plugin/mec-webhook-bridge.php` to WordPress
   - Activate the plugin

2. **Configure Plugin**
   - Go to `Settings → MEC Webhook Bridge`
   - **Webhook URL**: `https://mec-events-xxxxx-backend.ondigitalocean.app/api/webhooks/mec`
   - **Webhook Secret**: (use the same secret from your app.yaml)
   - ☑ Enable webhook notifications
   - Click "Save Changes"

3. **Test Webhook**
   - Click "Send Test Webhook" button
   - Should see: ✅ Success message
   - Check backend logs in DigitalOcean to confirm receipt

### Step 7: Run Database Migration (If Upgrading)

If you're upgrading from an existing deployment:

1. **Access Backend Console**
   - Go to your App → Backend component
   - Click "Console" tab
   - Click "Launch Console"

2. **Run Migration**
   ```bash
   node src/scripts/migrate-multi-site.js
   ```

3. **Verify Migration**
   ```bash
   # Should see successful migration messages
   # ✅ Migration completed successfully!
   ```

## 🔒 Security Checklist

After deployment, complete these security tasks:

- [ ] Change admin password from default
- [ ] Update JWT_SECRET to a strong random value
- [ ] Update WEBHOOK_SECRET to a strong random value
- [ ] Verify email settings are correct
- [ ] Test webhook from WordPress
- [ ] Enable 2FA on DigitalOcean account
- [ ] Set up uptime monitoring
- [ ] Configure backups for database

## 📊 Monitoring & Maintenance

### View Logs

1. **Backend Logs**:
   - App → Backend → Runtime Logs
   - Look for errors, webhook receipts

2. **Frontend Logs**:
   - App → Frontend → Runtime Logs

3. **Database Logs**:
   - Database Cluster → Logs & Insights

### Set Up Alerts

1. **Go to Database Cluster**
2. **Click "Settings"**
3. **Enable alerts for**:
   - CPU usage > 80%
   - Memory usage > 80%
   - Disk usage > 80%

### Database Backups

DigitalOcean automatically backs up your database:
- Daily backups for 7 days
- Can manually create backups anytime
- Located in: Database Cluster → Backups

### Scaling Up (When Needed)

To upgrade resources:

1. **Database**: 
   - Go to Database → Settings → Resize
   - Choose larger plan

2. **Backend/Frontend**:
   - Go to App → Settings → [Component]
   - Change `instance_size_slug` to larger size
   - Options: `basic-xxs` → `basic-xs` → `basic-s` → `basic-m`

## 🐛 Troubleshooting

### Backend Won't Start

**Check database connection**:
```bash
# In backend console
node -e "console.log(process.env.DB_HOST)"
```

**Verify environment variables are set**:
- Go to Backend → Settings → Environment Variables
- Ensure all required variables are present

### "Database Connection Failed"

1. **Check database is running**:
   - Go to Database Cluster
   - Status should be "Active"

2. **Verify connection details**:
   - Connection variables should be auto-populated
   - If manual, verify host/port/credentials

3. **Check firewall rules**:
   - Database should allow connections from your App

### Webhook Not Working

1. **Test webhook endpoint**:
   ```bash
   curl -X POST https://your-backend-url/api/webhooks/mec \
     -H "Content-Type: application/json" \
     -d '{"event_type":"test.webhook","data":{},"site_url":"test"}'
   ```

2. **Check webhook secret matches**:
   - Backend `WEBHOOK_SECRET` env variable
   - WordPress plugin webhook secret
   - Must be identical

3. **Check backend logs**:
   - Look for webhook receipt messages
   - Look for signature verification errors

### "Cannot Seed Database" Error

If the post-deploy job fails:

1. **Manually run seed**:
   - Open backend console
   - Run: `npm run seed`

2. **Check logs** for specific error

## 💰 Cost Optimization

### Development/Testing

Current minimum setup (~$17/month):
- Backend: $5/month (basic-xxs)
- Frontend: $5/month (basic-xxs)
- Database: $7/month (basic dev)

### Production (Recommended)

For production use (~$39/month):
- Backend: $12/month (basic-xs) - 1GB RAM
- Frontend: $5/month (basic-xxs) - static files
- Database: $15/month (basic) - production-ready
- Backup: $7/month - daily backups

### Save Money

- Use development database for testing ($7/month vs $15/month)
- Start with minimum instances, scale up as needed
- Set up alerts to prevent unexpected usage
- Use webhook method (free) instead of constant API polling

## 📞 Support

### DigitalOcean Support
- Documentation: https://docs.digitalocean.com/products/app-platform/
- Community: https://www.digitalocean.com/community
- Support ticket: Available in dashboard (for paid accounts)

### Application Issues
- Check logs first (most issues are configuration)
- Review environment variables
- Verify database connection
- Test webhook connectivity

## 🎯 Next Steps

After successful deployment:

1. ✅ Change default admin password
2. ✅ Create staff accounts
3. ✅ Configure WordPress plugin on all sites
4. ✅ Test event creation and syncing
5. ✅ Test QR code check-in
6. ✅ Configure email notifications
7. ✅ Set up monitoring alerts
8. ✅ Document your URLs and credentials securely

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [PostgreSQL Database Docs](https://docs.digitalocean.com/products/databases/postgresql/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [Multi-Site Setup Guide](MULTI-SITE-SETUP.md)
- [General Deployment Guide](DEPLOYMENT.md)

---

**🎉 Congratulations!** Your MEC Events system is now deployed and ready to use!

**Important URLs to Save:**
- Frontend: `https://mec-events-xxxxx.ondigitalocean.app`
- Backend API: `https://mec-events-xxxxx-backend.ondigitalocean.app`
- Database: (in DigitalOcean dashboard)

