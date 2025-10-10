# MEC Dashboard & Check-In App

A full-stack web application for managing event registrations, analytics, and check-ins for the Modern Events Calendar (MEC) WordPress plugin.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Features

### Core Features
- **MEC Integration** - Sync events and bookings from Modern Events Calendar REST API
- **Authentication** - Secure JWT-based auth with Admin and Staff roles
- **Dashboard** - Analytics overview with KPIs, charts, and trends
- **Event Management** - View, filter, and monitor events with detailed stats
- **QR Check-In** - Real-time QR code scanning for attendee check-ins
- **PDF/CSV Export** - Customizable attendee list exports
- **Email Notifications** - Automated reminders and follow-up emails
- **Automated Tasks** - Cron jobs for syncing data and sending reminders

### Tech Stack

#### Backend
- Node.js + Express
- PostgreSQL + Sequelize ORM
- JWT authentication
- Helmet, CORS, rate limiting
- Nodemailer for emails
- node-cron for scheduled tasks
- QRCode generation
- PDFKit for PDF exports

#### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router
- Zustand for state management
- Recharts for analytics
- html5-qrcode for QR scanning
- Lucide React icons
- React Hot Toast for notifications

#### Deployment
- Docker + Docker Compose
- PostgreSQL container
- Nginx for frontend
- Ready for DigitalOcean deployment

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 15+ (or use Docker)
- **Git**
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### Option 1: Local Development (Without Docker)

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd Mec-events
```

#### 2. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations and seed
npm run seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

#### 3. Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

#### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

**Demo Credentials:**
- **Admin:** admin@example.com / admin123
- **Staff:** staff@example.com / staff123

### Option 2: Docker Compose (Recommended for Production)

#### 1. Clone and Configure
```bash
git clone <repository-url>
cd Mec-events

# Create environment file
cp .env.example .env

# Edit configuration
nano .env
```

#### 2. Build and Start
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Seed the database (first time only)
docker-compose exec backend npm run seed
```

#### 3. Access
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health:** http://localhost:5000/api/health

#### 4. Stop Services
```bash
docker-compose down

# Remove volumes (warning: deletes all data)
docker-compose down -v
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env` file:

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mec_dashboard
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# MEC API
MEC_API_URL=https://housesoflight.org/wp-json/mec/v1.0
MEC_API_AUTH_USER=
MEC_API_AUTH_PASS=

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=MEC Dashboard <your-email@gmail.com>

# Organization
ORG_NAME=Houses of Light
ORG_LOGO_URL=https://housesoflight.org/logo.png

# Cron Schedules
SYNC_CRON_SCHEDULE=0 */3 * * *      # Every 3 hours
REMINDER_CRON_SCHEDULE=0 9 * * *    # 9 AM daily
```

### Frontend Environment Variables

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### Email Setup (Gmail)

1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate an App Password
4. Use the app password in `SMTP_PASS`

## 📁 Project Structure

```
Mec-events/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app config
│   │   ├── models/         # Sequelize models
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── services/       # Business logic (MEC, QR, Email, PDF)
│   │   ├── cron/           # Scheduled jobs
│   │   ├── scripts/        # Seed and migration scripts
│   │   └── server.js       # Entry point
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # API client
│   │   ├── store/          # Zustand store
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (admin only)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Events
- `GET /api/events` - List events (with filters)
- `GET /api/events/:id` - Get event details
- `GET /api/events/:id/analytics` - Get event analytics
- `POST /api/events/sync` - Sync from MEC API (admin only)
- `GET /api/events/:id/export/pdf` - Export attendees PDF
- `GET /api/events/:id/export/csv` - Export attendees CSV

### Registrations
- `GET /api/registrations` - List registrations
- `GET /api/registrations/:id` - Get registration details
- `POST /api/registrations/:id/checkin` - Check in attendee
- `POST /api/registrations/checkin/qr` - Check in via QR code
- `POST /api/registrations/:id/undo-checkin` - Undo check-in
- `GET /api/registrations/:id/qrcode` - Generate QR code
- `POST /api/registrations/:id/reminder` - Send reminder email

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🤖 Automated Tasks (Cron Jobs)

The backend runs automated scheduled tasks:

1. **MEC Sync** (Every 3 hours by default)
   - Syncs events and bookings from MEC API
   - Updates local database

2. **Event Reminders** (9 AM daily by default)
   - Sends reminder emails 24 hours before events
   - Only to attendees who haven't been sent reminders

3. **Follow-up Emails** (10 AM daily)
   - Sends thank you emails after events
   - Only to checked-in attendees

4. **Status Updates** (Midnight daily)
   - Updates event statuses (upcoming → ongoing → completed)

Configure schedules in `.env`:
```env
SYNC_CRON_SCHEDULE=0 */3 * * *      # Cron expression
REMINDER_CRON_SCHEDULE=0 9 * * *
```

[Cron Expression Guide](https://crontab.guru/)

## 🎨 User Roles

### Admin
- Full access to all features
- Sync events from MEC
- Export data (PDF/CSV)
- Send email notifications
- View analytics and reports
- Check in attendees

### Staff
- View events and registrations
- Check in attendees via QR scanner
- View dashboard
- Limited export capabilities

## 📱 QR Code Check-In

1. **Generate QR Codes** - Automatically generated for each registration
2. **Scan at Event** - Use the built-in scanner on the Check-In page
3. **Instant Feedback** - Real-time success/error messages
4. **Duplicate Prevention** - Can't check in twice
5. **Staff Tracking** - Records which staff member performed check-in

## 📊 Analytics & Reports

### Dashboard Metrics
- Total events, registrations, and check-ins
- Check-in rate percentage
- 30-day registration trend
- Top events by registration
- Upcoming events overview

### Event Details
- Registration trend chart
- Check-in status pie chart
- Attendee list with search/filter
- Capacity tracking
- Export functionality

## 🚢 Deployment

### DigitalOcean App Platform

1. **Create New App**
   - Connect GitHub repository
   - Select `docker-compose.yml`

2. **Configure Environment**
   - Add all required environment variables
   - Set production database credentials

3. **Deploy**
   - App Platform handles build and deployment
   - Automatic SSL certificates
   - Auto-scaling support

### DigitalOcean Droplet

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone <repository-url>
cd Mec-events

# Configure environment
cp .env.example .env
nano .env

# Start services
docker-compose up -d

# Seed database (first time)
docker-compose exec backend npm run seed

# View logs
docker-compose logs -f
```

## 🔒 Security Best Practices

1. **Change default passwords** - Update JWT secret and admin credentials
2. **Use strong passwords** - Minimum 12 characters with mixed case, numbers, symbols
3. **Enable HTTPS** - Use SSL certificates in production
4. **Secure email** - Use app-specific passwords, not main account password
5. **Rate limiting** - Already configured (100 requests per 15 minutes)
6. **CORS** - Configure allowed origins in production
7. **Environment variables** - Never commit `.env` files
8. **Database** - Use strong PostgreSQL password in production

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify database credentials in `.env`
- Check port 5000 is available: `lsof -i :5000`

### Frontend build errors
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (needs 18+)

### QR Scanner not working
- Ensure HTTPS (required for camera access)
- Grant browser camera permissions
- Check camera is not in use by another app

### Email not sending
- Verify SMTP credentials
- Check firewall allows port 587/465
- Use app-specific password for Gmail
- Test with: `npm run test-email` (create this script if needed)

### Docker issues
- Restart services: `docker-compose restart`
- Rebuild containers: `docker-compose up -d --build`
- Check logs: `docker-compose logs -f backend`
- Clean up: `docker system prune -a`

## 📝 Development Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start dev server with nodemon
npm run seed       # Seed database with sample data
```

### Frontend
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 💬 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Email: support@example.com
- Documentation: [Link to docs]

## 🙏 Acknowledgments

- Modern Events Calendar for the WordPress plugin
- DigitalOcean for hosting platform
- All contributors and testers

---

**Built with ❤️ for Houses of Light**

Version 1.0.0 - October 2025

