# Quick Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Git

## Local Development Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your database and SMTP credentials.

### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
cp .env.example .env
```

### 3. Set Up Database

**Option A: Using existing PostgreSQL**
```bash
# Create database
createdb mec_dashboard

# Run from backend directory
cd backend
npm run seed
```

**Option B: Using Docker**
```bash
# From project root
docker-compose up -d postgres

# Wait for postgres to be ready, then seed
docker-compose exec postgres pg_isready
cd backend && npm run seed
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:5173

### 5. Login

Navigate to http://localhost:5173

**Demo Credentials:**
- Admin: admin@example.com / admin123
- Staff: staff@example.com / staff123

## Docker Setup (Recommended)

```bash
# From project root
docker-compose up -d

# Seed database (first time only)
docker-compose exec backend npm run seed

# View logs
docker-compose logs -f
```

Access at http://localhost:5173

## Email Configuration

For Gmail:
1. Enable 2FA in Google Account
2. Generate App Password (Security → App Passwords)
3. Add to `backend/.env`:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

## Troubleshooting

**Port already in use:**
```bash
# Find process using port
lsof -i :5000  # backend
lsof -i :5173  # frontend
lsof -i :5432  # postgres

# Kill process
kill -9 <PID>
```

**Database connection error:**
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists

**Frontend can't connect to backend:**
- Check backend is running on port 5000
- Verify CORS is configured correctly
- Check `VITE_API_URL` in frontend/.env

## Next Steps

1. Configure MEC API URL in backend/.env
2. Set up SMTP for email notifications
3. Customize organization name and branding
4. Import events from MEC (use "Sync Now" button)
5. Test QR check-in functionality

## Production Deployment

See README.md for detailed deployment instructions for:
- DigitalOcean App Platform
- DigitalOcean Droplets
- Custom VPS

## Support

For issues or questions, refer to README.md or create an issue on GitHub.

