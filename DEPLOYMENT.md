# Deployment Checklist

## Pre-Deployment

### Security
- [ ] Change JWT_SECRET to a strong random value
- [ ] Update all default passwords (admin, staff, database)
- [ ] Remove demo credentials after creating real accounts
- [ ] Configure CORS with specific origins (not *)
- [ ] Enable HTTPS/SSL certificates
- [ ] Set NODE_ENV=production

### Configuration
- [ ] Configure MEC API URL and credentials (if using API sync)
- [ ] Set up webhook secret (WEBHOOK_SECRET)
- [ ] Configure default source URL (DEFAULT_SOURCE_URL)
- [ ] Set up email (SMTP) configuration
- [ ] Update organization name and branding
- [ ] Configure cron schedules for your timezone
- [ ] Set proper database credentials
- [ ] Configure CLIENT_URL for production domain

### Testing
- [ ] Test login with admin and staff accounts
- [ ] Verify webhook endpoint is accessible
- [ ] Test webhook from WordPress plugin
- [ ] Verify MEC API sync works (if using API method)
- [ ] Test multi-site event syncing (if applicable)
- [ ] Test QR code generation and scanning
- [ ] Verify email sending (reminder, follow-up)
- [ ] Test PDF and CSV exports
- [ ] Check all dashboard analytics load
- [ ] Test on mobile devices

## DigitalOcean App Platform ✅ DEPLOYED

### 1. Repository Setup ✅
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. App Configuration ✅
- **App Name**: `mec-events-app`
- **Region**: `sfo3` (San Francisco)
- **Repository**: `carloschuck/Mec-events`
- **Branch**: `main`
- **Auto-deploy**: Enabled

### 3. Components ✅

**Database:**
- **Type**: External PostgreSQL (DigitalOcean Managed Database)
- **Host**: `mec-events-db-do-user-24283710-0.m.db.ondigitalocean.com`
- **Port**: `25060`
- **Database**: `defaultdb`
- **User**: `doadmin`
- **SSL**: Required

**Backend Service:**
- **Name**: `backend`
- **Dockerfile**: `backend/Dockerfile`
- **HTTP Port**: `5000`
- **Health Check**: `/api/health`
- **Instance**: `basic-xxs`

**Frontend Service:**
- **Name**: `frontend`
- **Dockerfile**: `frontend/Dockerfile`
- **HTTP Port**: `8080`
- **Instance**: `basic-xxs`

### 4. Environment Variables ✅

**Backend Service:**
```
NODE_ENV=production
PORT=5000
JWT_SECRET=<encrypted-secret>
JWT_EXPIRES_IN=7d
WEBHOOK_SECRET=<encrypted-secret>
DEFAULT_SOURCE_URL=https://housesoflight.org
MEC_API_URL=https://housesoflight.org/wp-json/mec/v1.0
CLIENT_URL=${APP_URL}
ORG_NAME=Houses of Light
SYNC_CRON_SCHEDULE=0 */3 * * *
REMINDER_CRON_SCHEDULE=0 9 * * *
DB_HOST=mec-events-db-do-user-24283710-0.m.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=<encrypted-secret>
DB_SKIP_SYNC=true
```

**Frontend Service:**
```
VITE_API_URL=${APP_URL}/api
```

### 5. Deployment Status ✅
- **App URL**: `https://mec-events-app-hey4v.ondigitalocean.app`
- **Status**: ACTIVE
- **Health**: Both services HEALTHY
- **Last Deployed**: Successfully deployed

### 6. Post-Deployment Setup ✅

**Database Initialization:**
```bash
# Run via API endpoint (recommended)
curl -X POST https://mec-events-app-hey4v.ondigitalocean.app/api/setup-db

# Or via DigitalOcean console
cd /app && node src/scripts/setup-database.js
```

**Admin User Created:**
- **Email**: `admin@housesoflight.org`
- **Password**: `admin123`
- **Role**: `admin`
- **Status**: Active and verified

**Configure WordPress Plugin:**
1. Install the MEC Webhook Bridge plugin on your WordPress site(s)
2. Configure webhook URL: `https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec`
3. Set webhook secret to match `WEBHOOK_SECRET` env variable
4. Enable webhooks and test

**Plugin Configuration Details:**
- **Webhook URL**: `https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec`
- **Webhook Secret**: `juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=` (from environment)
- **Events to Sync**: All MEC events and bookings
- **Multi-Site Support**: Enabled (each site sends its `site_url`)

See [MULTI-SITE-SETUP.md](MULTI-SITE-SETUP.md) for detailed multi-site configuration.

## DigitalOcean Droplet

### 1. Create Droplet
- Ubuntu 22.04 LTS
- Basic plan ($6/month minimum)
- Choose datacenter region
- Add SSH key

### 2. Initial Setup
```bash
# SSH into droplet
ssh root@<droplet-ip>

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Create non-root user (optional but recommended)
adduser deployer
usermod -aG sudo deployer
usermod -aG docker deployer
```

### 3. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd Mec-events

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values
# Make sure to set:
# - JWT_SECRET
# - WEBHOOK_SECRET
# - DEFAULT_SOURCE_URL
# - Database credentials
# - Email settings

cp frontend/.env.example frontend/.env
nano frontend/.env  # Set VITE_API_URL

# Start services
docker-compose up -d

# Seed database (first time only)
docker-compose exec backend npm run seed

# OR if upgrading existing deployment with multi-site support
docker-compose exec backend node src/scripts/migrate-multi-site.js

# Check logs
docker-compose logs -f
```

### 4. Configure Firewall
```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 5. Set Up Nginx Reverse Proxy (Optional)
```bash
# Install nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/mec-dashboard

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

# Enable site
ln -s /etc/nginx/sites-available/mec-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6. Set Up SSL with Let's Encrypt
```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### 7. Set Up Auto-Start
```bash
# Add to crontab
crontab -e

# Add this line:
@reboot cd /path/to/Mec-events && docker-compose up -d
```

## Post-Deployment Verification

### Health Checks
- [ ] Backend health: https://your-domain.com/api/health
- [ ] Webhook endpoint: https://your-domain.com/api/webhooks/mec
- [ ] Frontend loads properly
- [ ] Login works
- [ ] Database connection successful

### Functionality Tests
- [ ] Test webhook from WordPress plugin
- [ ] Verify events sync from WordPress
- [ ] Verify registrations sync properly
- [ ] Test multi-site setup (if using multiple sites)
- [ ] Create test event
- [ ] Register test attendee
- [ ] Generate QR code
- [ ] Test QR scanner
- [ ] Export PDF/CSV
- [ ] Send test email
- [ ] Check cron jobs are running

### Multi-Site Verification (if applicable)
- [ ] Install plugin on each WordPress site
- [ ] Configure each plugin with same webhook URL and secret
- [ ] Test webhook from each site
- [ ] Verify events from different sites appear in database
- [ ] Check `sourceUrl` field is correctly populated
- [ ] Verify no duplicate events between sites

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, StatusCake)
- [ ] Configure log aggregation
- [ ] Set up backup schedule
- [ ] Monitor disk space
- [ ] Monitor database performance

## Backup Strategy

### Database Backups
```bash
# Manual backup
docker-compose exec postgres pg_dump -U postgres mec_dashboard > backup.sql

# Automated daily backups (add to crontab)
0 2 * * * cd /path/to/Mec-events && docker-compose exec -T postgres pg_dump -U postgres mec_dashboard > /backups/mec_$(date +\%Y\%m\%d).sql
```

### Application Backups
```bash
# Backup docker volumes
docker-compose down
tar -czf mec-backup.tar.gz postgres_data/
docker-compose up -d
```

## Rollback Plan

### Quick Rollback
```bash
# Stop current version
docker-compose down

# Pull previous version
git checkout <previous-commit>

# Rebuild and start
docker-compose up -d --build

# Restore database if needed
docker-compose exec -T postgres psql -U postgres mec_dashboard < backup.sql
```

## Scaling Considerations

### Horizontal Scaling
- Use DigitalOcean Load Balancer
- Multiple backend instances
- Shared PostgreSQL database
- Centralized Redis for sessions (future enhancement)

### Vertical Scaling
- Upgrade droplet size
- Increase PostgreSQL resources
- Optimize database indexes
- Enable query caching

## Maintenance

### Regular Tasks
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review user accounts
- [ ] Quarterly: Security audit
- [ ] Quarterly: Database optimization

### Update Procedure
```bash
# Backup first!
docker-compose exec postgres pg_dump -U postgres mec_dashboard > backup.sql

# Pull updates
git pull origin main

# Check if migration is needed
# Review CHANGELOG or commit messages for migration requirements

# Run migrations if needed (e.g., for multi-site support)
docker-compose exec backend node src/scripts/migrate-multi-site.js

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify everything works
docker-compose logs -f

# Test webhook connectivity
curl -X POST https://your-domain.com/api/webhooks/mec \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.webhook","data":{},"site_url":"test"}'
```

## Troubleshooting Production Issues

### Application Won't Start
```bash
# Check logs
docker-compose logs -f backend

# Check database
docker-compose logs -f postgres

# Verify environment variables
docker-compose config
```

### High CPU/Memory Usage
```bash
# Check container stats
docker stats

# Restart specific service
docker-compose restart backend
```

### Database Issues
```bash
# Connect to database
docker-compose exec postgres psql -U postgres mec_dashboard

# Check connections
SELECT * FROM pg_stat_activity;

# Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active';
```

## Support Contacts

- **Technical Issues:** [Support Email]
- **MEC API Issues:** Check MEC documentation
- **DigitalOcean Support:** Open ticket in dashboard
- **Emergency Contact:** [Phone Number]

---

**Remember:** Always backup before making changes in production!

