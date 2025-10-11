# MEC Events Management System

A modern event management system that integrates with WordPress Modern Events Calendar (MEC) to provide a comprehensive dashboard for managing events, registrations, and check-ins.

## 🚀 Features

- **Event Management**: View, filter, and manage events from WordPress MEC
- **Registration Tracking**: Real-time registration data with attendee information
- **Check-in System**: QR code-based check-in functionality
- **Analytics Dashboard**: Event statistics and registration trends
- **Advanced Filtering**: Filter events by date, status, capacity, location, and more
- **Export Capabilities**: PDF and CSV export for attendee lists
- **Responsive Design**: Modern UI that works on all devices

## 📁 Project Structure

```
Mec-events/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/        # API route handlers
│   │   ├── models/            # Database models (Sequelize)
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Authentication & validation
│   │   ├── config/            # Database configuration
│   │   ├── scripts/           # Database setup scripts
│   │   └── server.js          # Main server file
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # React/Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Main application pages
│   │   ├── store/            # State management (Zustand)
│   │   ├── lib/              # API client and utilities
│   │   └── main.jsx          # Application entry point
│   ├── Dockerfile
│   └── package.json
├── wordpress-plugin/          # WordPress MEC Bridge Plugin
│   ├── mec-api-bridge.php    # Main plugin file
│   ├── mec-api-bridge-with-bookings.zip  # Latest plugin package
│   ├── INSTALLATION.md       # Plugin installation guide
│   └── README.md             # Plugin documentation
├── docker-compose.yml         # Docker development setup
├── DEPLOYMENT.md             # Production deployment guide
├── BOOKINGS-SYNC-SETUP.md    # Booking synchronization setup
├── MEC-REST-API-SETUP.md     # MEC API configuration
├── WORDPRESS-PLUGIN-SETUP.md # WordPress plugin setup
└── README.md                 # This file
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Sequelize** ORM
- **JWT** authentication
- **Docker** containerization

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons

### WordPress Integration
- **Custom REST API** endpoints
- **MEC Bridge Plugin** for data synchronization
- **WordPress Users** integration for attendee data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)
- WordPress with MEC plugin

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Mec-events
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your database and MEC API settings
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **WordPress Plugin**
   - Upload `wordpress-plugin/mec-api-bridge-with-bookings.zip` to WordPress
   - Activate the plugin
   - Configure API endpoints

### Docker Setup
```bash
docker-compose up -d
```

## 📋 Key Features

### Event Management
- **Advanced Filtering**: Filter by date range, status, capacity, location
- **Smart Sorting**: Sort by date, title, or registration count
- **Real-time Sync**: Automatic synchronization with WordPress MEC
- **Status Tracking**: Upcoming, ongoing, completed, cancelled events

### Registration Management
- **Attendee Information**: Names, emails, phone numbers
- **Registration Tracking**: Real-time registration counts
- **Check-in System**: QR code-based check-ins
- **Export Options**: PDF and CSV export capabilities

### Analytics & Reporting
- **Event Statistics**: Registration trends, capacity utilization
- **Check-in Analytics**: Real-time check-in status
- **Performance Metrics**: Event popularity and engagement

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mec_events

# MEC API
MEC_API_URL=https://your-wordpress-site.com/wp-json/mec/v1.0

# JWT
JWT_SECRET=your-secret-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### WordPress Plugin Configuration
1. Install the MEC API Bridge plugin
2. Configure API endpoints in WordPress
3. Set up proper permissions for REST API access
4. Test the connection with the backend

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Booking Sync Setup](BOOKINGS-SYNC-SETUP.md) - Configure booking synchronization
- [MEC API Setup](MEC-REST-API-SETUP.md) - WordPress MEC API configuration
- [WordPress Plugin Setup](WORDPRESS-PLUGIN-SETUP.md) - Plugin installation guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation files
- Review the WordPress plugin setup
- Ensure proper API configuration
- Verify database connectivity

---

**Note**: This system requires WordPress with the Modern Events Calendar (MEC) plugin installed and properly configured.