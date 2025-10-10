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
- [ ] Configure MEC API URL and credentials
- [ ] Set up email (SMTP) configuration
- [ ] Update organization name and branding
- [ ] Configure cron schedules for your timezone
- [ ] Set proper database credentials
- [ ] Configure CLIENT_URL for production domain

### Testing
- [ ] Test login with admin and staff accounts
- [ ] Verify MEC API sync works
- [ ] Test QR code generation and scanning
- [ ] Verify email sending (reminder, follow-up)
- [ ] Test PDF and CSV exports
- [ ] Check all dashboard analytics load
- [ ] Test on mobile devices

## DigitalOcean App Platform

### 1. Prepare Repository
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Create App
1. Log into DigitalOcean
2. Apps → Create App
3. Connect to GitHub repository
4. Select repository and branch

### 3. Configure Components

**Database:**
- Add PostgreSQL database
- Note credentials for environment variables

**Backend Service:**
- Name: mec-backend
- Environment: Docker
- Dockerfile path: backend/Dockerfile
- HTTP Port: 5000
- Health Check: /api/health

**Frontend Service:**
- Name: mec-frontend
- Environment: Docker
- Dockerfile path: frontend/Dockerfile
- HTTP Port: 80

### 4. Environment Variables

Add these to backend service:
```
NODE_ENV=production
JWT_SECRET=<your-strong-secret>
MEC_API_URL=https://housesoflight.org/wp-json/mec/v1.0
CLIENT_URL=https://your-app.ondigitalocean.app
DB_HOST=<db-host>
DB_PORT=25060
DB_NAME=<db-name>
DB_USER=<db-user>
DB_PASSWORD=<db-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<app-password>
EMAIL_FROM=MEC Dashboard <your-email>
ORG_NAME=Houses of Light
```

Add to frontend service:
```
VITE_API_URL=https://your-backend-url/api
```

### 5. Deploy
1. Click "Deploy"
2. Wait for build and deployment
3. Note the app URL

### 6. Post-Deployment
```bash
# SSH into backend container via App Platform console
# Seed database
npm run seed
```

Or use DigitalOcean's console to run:
```bash
cd /app && npm run seed
```

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
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker-compose up -d

# Seed database (first time)
docker-compose exec backend npm run seed

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
- [ ] Frontend loads properly
- [ ] Login works
- [ ] Database connection successful

### Functionality Tests
- [ ] Create test event
- [ ] Register test attendee
- [ ] Generate QR code
- [ ] Test QR scanner
- [ ] Export PDF/CSV
- [ ] Send test email
- [ ] Check cron jobs are running

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

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify everything works
docker-compose logs -f
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

