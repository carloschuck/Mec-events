# Quick Reference Commands

## Local Development

### Backend
```bash
cd backend

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Restart a service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Check service status
docker-compose ps
```

### Database Operations
```bash
# Seed database
docker-compose exec backend npm run seed

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d mec_dashboard

# Backup database
docker-compose exec postgres pg_dump -U postgres mec_dashboard > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres mec_dashboard < backup.sql

# Check database connection
docker-compose exec postgres pg_isready
```

### Container Management
```bash
# Shell into backend container
docker-compose exec backend sh

# Shell into postgres container
docker-compose exec postgres bash

# View container stats
docker stats

# Remove all containers and volumes (CAREFUL!)
docker-compose down -v

# Prune unused Docker resources
docker system prune -a
```

## Database Commands

### PostgreSQL (Local)
```bash
# Create database
createdb mec_dashboard

# Drop database
dropdb mec_dashboard

# Connect to database
psql -d mec_dashboard

# Import SQL file
psql -d mec_dashboard -f backup.sql

# Export database
pg_dump mec_dashboard > backup.sql
```

### Common SQL Queries
```sql
-- Check all tables
\dt

-- View users
SELECT * FROM users;

-- View events
SELECT * FROM events ORDER BY "startDate" DESC;

-- View registrations with event info
SELECT r.*, e.title 
FROM registrations r 
JOIN events e ON r."eventId" = e.id 
ORDER BY r."registrationDate" DESC;

-- Check-in statistics
SELECT 
  e.title,
  COUNT(*) as total_registrations,
  SUM(CASE WHEN r."checkedIn" THEN 1 ELSE 0 END) as checked_in
FROM events e
LEFT JOIN registrations r ON e.id = r."eventId"
GROUP BY e.id, e.title;

-- Delete all data (CAREFUL!)
TRUNCATE TABLE registrations, events, users CASCADE;
```

## Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main

# View differences
git diff
```

## Testing & Debugging

### API Testing with curl
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get events (with auth token)
curl http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Sync events (admin only)
curl -X POST http://localhost:5000/api/events/sync \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Check Logs
```bash
# Backend logs (local)
cd backend && tail -f *.log

# Frontend dev server logs
# Visible in terminal where npm run dev is running

# System logs (production)
journalctl -u mec-dashboard -f
```

## Maintenance Commands

### Update Dependencies
```bash
# Check for outdated packages
npm outdated

# Update all packages (backend)
cd backend && npm update

# Update all packages (frontend)
cd frontend && npm update

# Update specific package
npm update package-name

# Install latest versions (CAREFUL!)
npm install package-name@latest
```

### Clean Install
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port Management
```bash
# Find process using port
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL

# Kill process by port
kill -9 $(lsof -t -i:5000)

# Or use specific PID
kill -9 <PID>
```

## Production Commands

### Deployment
```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose down
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

### Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check Docker disk usage
docker system df

# Monitor live logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Backup & Restore
```bash
# Full backup
docker-compose exec postgres pg_dump -U postgres mec_dashboard > backup_$(date +%Y%m%d).sql

# Compress backup
tar -czf backup_$(date +%Y%m%d).tar.gz backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose down
docker-compose up -d postgres
# Wait for postgres to be ready
docker-compose exec -T postgres psql -U postgres mec_dashboard < backup.sql
docker-compose up -d
```

### Security
```bash
# Generate strong JWT secret
openssl rand -base64 32

# Check SSL certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew SSL certificate
certbot renew

# Check open ports
nmap localhost
```

## Quick Fixes

### "Port already in use"
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL (Docker)
docker-compose restart postgres

# Check connection
psql -d mec_dashboard -c "SELECT 1"
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "CORS error"
```bash
# Check backend .env has correct CLIENT_URL
# Check frontend is making requests to correct API URL
# Restart both servers
```

### "QR Scanner not working"
```bash
# Ensure using HTTPS (camera requires secure context)
# Check browser permissions for camera
# Try different browser
# Check browser console for errors
```

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# MEC Dashboard aliases
alias mec-up='docker-compose up -d'
alias mec-down='docker-compose down'
alias mec-logs='docker-compose logs -f'
alias mec-restart='docker-compose restart'
alias mec-backend-logs='docker-compose logs -f backend'
alias mec-frontend-logs='docker-compose logs -f frontend'
alias mec-db-logs='docker-compose logs -f postgres'
alias mec-shell='docker-compose exec backend sh'
alias mec-db-shell='docker-compose exec postgres psql -U postgres -d mec_dashboard'
alias mec-backup='docker-compose exec postgres pg_dump -U postgres mec_dashboard > backup_$(date +%Y%m%d).sql'
alias mec-status='docker-compose ps'
```

Then reload: `source ~/.bashrc` or `source ~/.zshrc`

---

**Pro Tip:** Create a `Makefile` in the project root for even easier commands!

```makefile
.PHONY: up down logs restart seed backup

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

seed:
	docker-compose exec backend npm run seed

backup:
	docker-compose exec postgres pg_dump -U postgres mec_dashboard > backup_$(shell date +%Y%m%d).sql
```

Then use: `make up`, `make down`, `make logs`, etc.

