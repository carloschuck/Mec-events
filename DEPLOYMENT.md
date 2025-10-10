# 🚀 Deployment Guide

## ✅ Current Deployment Status

**App URL**: https://mec-events-app-hey4v.ondigitalocean.app  
**Status**: ACTIVE and HEALTHY  
**Region**: San Francisco (SFO3)  
**Deployed**: October 10, 2025  

## 🔑 Login Credentials

- **Email**: `admin@housesoflight.org`
- **Password**: `admin123`
- **Role**: Admin

## 🗄️ Database

- **Type**: DigitalOcean Managed PostgreSQL
- **Host**: `mec-events-db-do-user-24283710-0.m.db.ondigitalocean.com`
- **Port**: `25060`
- **Database**: `defaultdb`
- **User**: `doadmin`
- **Status**: Connected and initialized

## 🔌 WordPress Plugin Configuration

**Webhook URL**: `https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec`  
**Webhook Secret**: `juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=`

### Plugin Setup Steps:
1. Download `mec-webhook-bridge.zip` from the project directory
2. Upload to WordPress via Plugins → Add New → Upload Plugin
3. Configure the webhook URL and secret above
4. Enable webhooks and test the connection

## 🏗️ DigitalOcean App Platform Configuration

### App Details
- **Name**: `mec-events-app`
- **Region**: `sfo3` (San Francisco)
- **Repository**: `carloschuck/Mec-events`
- **Branch**: `main`
- **Auto-deploy**: Enabled

### Services Configuration

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

### Environment Variables

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

### Routing Configuration

```yaml
ingress:
  rules:
    - match:
        path:
          prefix: "/api"
      component:
        name: "backend"
        preserve_path_prefix: true
    - match:
        path:
          prefix: "/"
      component:
        name: "frontend"
```

## 🧪 Testing Endpoints

**Health Check**: `https://mec-events-app-hey4v.ondigitalocean.app/api/health`  
**Login Test**: `https://mec-events-app-hey4v.ondigitalocean.app/api/auth/login`  
**Webhook Test**: `https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec`

## 📊 Features Available

- ✅ User authentication and authorization
- ✅ Event management and synchronization
- ✅ Registration and check-in system
- ✅ QR code generation and scanning
- ✅ Multi-site support
- ✅ Webhook integration with WordPress MEC
- ✅ Dashboard and analytics
- ✅ PDF and CSV exports
- ✅ Email notifications

## 🔧 Deployment Process

### 1. Repository Setup
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. DigitalOcean App Creation
1. Log into DigitalOcean
2. Apps → Create App
3. Connect to GitHub repository: `carloschuck/Mec-events`
4. Select branch: `main`
5. Configure services and environment variables
6. Deploy

### 3. Database Setup
1. Create DigitalOcean Managed PostgreSQL database
2. Configure connection details in environment variables
3. Run database initialization via API endpoint:
   ```bash
   curl -X POST https://mec-events-app-hey4v.ondigitalocean.app/api/setup-db
   ```

### 4. WordPress Plugin Configuration
1. Install the MEC Webhook Bridge plugin
2. Configure webhook URL and secret
3. Enable webhooks and test connection

## 🚀 Alternative Deployment Methods

### Docker Compose (Local/Server)

```bash
# Clone repository
git clone <repository-url>
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

### Manual Server Setup

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Clone and setup
git clone <repository-url>
cd Mec-events

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with production values
npm run seed
npm start

# Frontend setup (separate terminal)
cd ../frontend
npm install
cp .env.example .env
npm run build
# Serve with nginx or similar
```

## 🔒 Security Configuration

### Environment Variables
- All secrets are encrypted in DigitalOcean
- Database connection uses SSL
- Webhook secret ensures secure communication
- JWT tokens have expiration

### SSL/HTTPS
- Automatic SSL certificates via DigitalOcean
- All traffic encrypted
- Required for QR scanner functionality

### Database Security
- SSL connection required
- Strong password authentication
- Managed database with automatic backups

## 📈 Monitoring & Maintenance

### Health Checks
- Backend health endpoint: `/api/health`
- Automatic health monitoring in DigitalOcean
- Service restart on failure

### Logs
- Access logs via DigitalOcean App Platform
- Backend logs for debugging
- Webhook activity logs

### Backups
- Database backups handled by DigitalOcean
- Automatic daily backups
- Point-in-time recovery available

## 🐛 Troubleshooting

### Common Issues

**App Won't Start**:
- Check environment variables are set correctly
- Verify database connection
- Check logs in DigitalOcean dashboard

**Database Connection Issues**:
- Verify database credentials
- Check SSL connection settings
- Ensure database is accessible from app

**Webhook Issues**:
- Verify webhook URL and secret
- Check WordPress plugin configuration
- Test webhook endpoint manually

**Frontend Issues**:
- Check VITE_API_URL is set correctly
- Verify backend is accessible
- Check browser console for errors

### Debug Commands

```bash
# Test database connection
curl -X POST https://mec-events-app-hey4v.ondigitalocean.app/api/setup-db

# Test webhook endpoint
curl -X POST https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec \
  -H "Content-Type: application/json" \
  -H "X-MEC-Signature: <signature>" \
  -d '{"event_type":"test.webhook","data":{},"timestamp":"2025-10-10T18:45:00","site_url":"https://housesoflight.org"}'

# Check app health
curl https://mec-events-app-hey4v.ondigitalocean.app/api/health
```

## 📞 Support

For deployment issues:
1. Check DigitalOcean App Platform logs
2. Verify environment variables
3. Test individual components
4. Review this documentation

---

**🎉 Your MEC Events Dashboard is now live and ready to use!**