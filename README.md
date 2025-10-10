# MEC Events Dashboard & Check-In App

A full-stack web application for managing event registrations, analytics, and check-ins for the Modern Events Calendar (MEC) WordPress plugin.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Features

- **MEC Integration** - Real-time webhook sync with Modern Events Calendar
- **Multi-Site Support** - Aggregate events from multiple WordPress sites
- **Authentication** - Secure JWT-based auth with Admin and Staff roles
- **Dashboard** - Analytics overview with KPIs, charts, and trends
- **QR Check-In** - Real-time QR code scanning for attendee check-ins
- **PDF/CSV Export** - Customizable attendee list exports
- **Email Notifications** - Automated reminders and follow-up emails
- **WordPress Plugin** - Bridge plugin for webhook integration

## 🚀 Live Application

**URL**: https://mec-events-app-hey4v.ondigitalocean.app  
**Status**: ACTIVE and HEALTHY  
**Login**: `admin@housesoflight.org` / `admin123`

## 🏗️ Tech Stack

**Backend**: Node.js + Express + PostgreSQL + Sequelize  
**Frontend**: React 18 + Vite + Tailwind CSS  
**Deployment**: DigitalOcean App Platform  
**Database**: PostgreSQL with SSL  

## 📦 Quick Start

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd Mec-events

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run seed
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

**Access**: http://localhost:5173

### Docker Deployment

```bash
# Configure environment
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose up -d

# Seed database (first time)
docker-compose exec backend npm run seed
```

## 🔌 WordPress Integration

### 1. Download Plugin
- Download `mec-webhook-bridge.zip` from the project directory
- Upload to WordPress via Plugins → Add New → Upload Plugin

### 2. Configure Plugin
- **Webhook URL**: `https://mec-events-app-hey4v.ondigitalocean.app/api/webhooks/mec`
- **Webhook Secret**: `juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=`
- **Enable Webhooks**: ✅ Check the box
- **Test**: Click "Send Test Webhook"

### 3. Multi-Site Setup
Install the plugin on multiple WordPress sites using the same webhook URL and secret. Each site will automatically send its `site_url` for proper event tracking.

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-app.ondigitalocean.app

# Database
DB_HOST=your-db-host
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Webhook
WEBHOOK_SECRET=juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=
DEFAULT_SOURCE_URL=https://housesoflight.org

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=MEC Dashboard <your-email@gmail.com>

# Organization
ORG_NAME=Houses of Light
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-app.ondigitalocean.app/api
```

## 🚢 Deployment

### DigitalOcean App Platform (Current Setup)

1. **App Configuration**:
   - **Name**: `mec-events-app`
   - **Region**: San Francisco (SFO3)
   - **Repository**: `carloschuck/Mec-events`
   - **Auto-deploy**: Enabled

2. **Services**:
   - **Backend**: Node.js service (port 5000)
   - **Frontend**: React service (port 8080)
   - **Database**: External PostgreSQL managed database

3. **Environment Variables**: All configured and encrypted in DigitalOcean

4. **Status**: ✅ ACTIVE and HEALTHY

### Manual Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details
- `GET /api/events/:id/export/pdf` - Export attendees PDF

### Registrations
- `GET /api/registrations` - List registrations
- `POST /api/registrations/:id/checkin` - Check in attendee
- `POST /api/registrations/checkin/qr` - Check in via QR code

### Webhooks
- `POST /api/webhooks/mec` - Receive MEC webhooks

## 🎨 User Roles

### Admin
- Full access to all features
- Export data (PDF/CSV)
- Send email notifications
- View analytics and reports

### Staff
- View events and registrations
- Check in attendees via QR scanner
- View dashboard

## 📱 QR Code Check-In

1. **Generate QR Codes** - Automatically generated for each registration
2. **Scan at Event** - Use the built-in scanner on the Check-In page
3. **Instant Feedback** - Real-time success/error messages
4. **Duplicate Prevention** - Can't check in twice

## 📊 Analytics & Reports

### Dashboard Metrics
- Total events, registrations, and check-ins
- Check-in rate percentage
- 30-day registration trend
- Top events by registration

### Event Details
- Registration trend chart
- Check-in status pie chart
- Attendee list with search/filter
- Export functionality

## 🔒 Security

- JWT authentication with secure tokens
- HMAC SHA-256 webhook signature verification
- Rate limiting (100 requests per 15 minutes)
- HTTPS/SSL encryption
- Environment variable encryption in DigitalOcean

## 🐛 Troubleshooting

### Common Issues

**Login Problems**:
- Verify credentials: `admin@housesoflight.org` / `admin123`
- Check if user exists in database

**Webhook Issues**:
- Verify webhook URL and secret are correct
- Check WordPress plugin is activated
- Test webhook connection

**QR Scanner Issues**:
- Ensure HTTPS (required for camera access)
- Grant browser camera permissions

**Email Issues**:
- Verify SMTP credentials
- Use app-specific password for Gmail

## 📁 Project Structure

```
Mec-events/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.js       # Entry point
│   └── Dockerfile
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── store/          # State management
│   └── Dockerfile
├── wordpress-plugin/       # WordPress bridge plugin
│   └── mec-webhook-bridge.php
├── .do/                    # DigitalOcean config
│   └── app.yaml
└── docker-compose.yml
```

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[WORDPRESS-PLUGIN-SETUP.md](WORDPRESS-PLUGIN-SETUP.md)** - Plugin installation guide

## 💬 Support

For issues or questions:
- Check the troubleshooting section above
- Review the deployment documentation
- Open an issue on GitHub

---

**Built with ❤️ for Houses of Light**

Version 1.0.0 - October 2025