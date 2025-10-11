# Production Deployment Guide

## 🚀 Deploy to Production Server

### Prerequisites
- Git repository pushed to GitHub
- SSH access to production server
- Docker and Docker Compose installed on production server

---

## Step 1: Push Changes to GitHub

```bash
cd /Volumes/Z/APPS/Mec-events
git push origin main
```

---

## Step 2: Install WordPress Plugin

**On your WordPress site (housesoflight.org):**

1. **Download the plugin zip file** from:
   - `wordpress-plugin/mec-api-bridge-updated.zip`
   
2. **Install via WordPress Admin:**
   - Go to **Plugins → Add New → Upload Plugin**
   - Upload `mec-api-bridge-updated.zip`
   - Click **Install Now** → **Activate**

3. **Flush permalinks:**
   - Go to **Settings → Permalinks**
   - Click **Save Changes** (no changes needed)

4. **Test the API endpoint:**
   ```bash
   curl "https://housesoflight.org/wp-json/mec-bridge/v1/events?per_page=5"
   ```
   You should see JSON with your events and metadata.

---

## Step 3: Deploy Backend to Production Server

### SSH into your production server:

```bash
ssh your-user@your-production-server
```

### Navigate to your project directory:

```bash
cd /path/to/Mec-events
```

### Pull latest changes:

```bash
git pull origin main
```

### Rebuild and restart containers:

```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Verify containers are running:

```bash
docker-compose ps
```

### Check logs:

```bash
docker-compose logs -f backend
```

---

## Step 4: Clean Up Old Events (One-Time)

If your production database has old events from 2023, clean them up:

```bash
docker exec mec-postgres psql -U postgres -d mec_dashboard -c "DELETE FROM events WHERE \"startDate\" < NOW() - INTERVAL '1 day'; SELECT COUNT(*) as remaining_events FROM events;"
```

---

## Step 5: Trigger Initial Sync

```bash
curl -X POST http://your-production-url/api/mec-api/sync/events
```

Or if running locally on the server:

```bash
curl -X POST http://localhost:5000/api/mec-api/sync/events
```

---

## Step 6: Verify Everything Works

### Check Events in Database:

```bash
docker exec mec-postgres psql -U postgres -d mec_dashboard -c "SELECT title, TO_CHAR(\"startDate\", 'YYYY-MM-DD') as start_date, status FROM events ORDER BY \"startDate\" LIMIT 10;"
```

### Check Cron Jobs:

```bash
docker-compose logs backend | grep "📅"
```

You should see:
- ✅ MEC sync scheduled: 0 */3 * * * (every 3 hours)
- ✅ Event reminders scheduled: 0 9 * * *
- ✅ Follow-up emails scheduled: 0 10 * * *
- ✅ Status updates scheduled: 0 0 * * *
- ✅ Event cleanup scheduled: 0 2 * * *

### Test Frontend:

Visit your production dashboard URL and verify:
- ✅ Only upcoming events are showing
- ✅ Events have correct dates
- ✅ No 2023 events appear

---

## 🔧 Troubleshooting

### Issue: API endpoint returns 404

**Solution:**
- Make sure WordPress plugin is activated
- Flush permalinks: Settings → Permalinks → Save Changes
- Test: `curl https://housesoflight.org/wp-json/mec-bridge/v1/events`

### Issue: No events syncing

**Solution:**
```bash
# Check if MEC_API_URL is set correctly
docker-compose exec backend env | grep MEC_API_URL

# Should be: MEC_API_URL=https://housesoflight.org
```

### Issue: Old events still showing

**Solution:**
```bash
# Manually delete old events
docker exec mec-postgres psql -U postgres -d mec_dashboard -c "DELETE FROM events WHERE \"startDate\" < NOW();"

# Trigger fresh sync
curl -X POST http://localhost:5000/api/mec-api/sync/events
```

### Issue: Container won't start

**Solution:**
```bash
# Check logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

---

## 📊 Monitoring

### View Real-Time Logs:

```bash
docker-compose logs -f backend
```

### Check Sync Status:

```bash
docker-compose logs backend | grep "Sync completed"
```

### Monitor Database:

```bash
docker exec mec-postgres psql -U postgres -d mec_dashboard -c "SELECT status, COUNT(*) FROM events GROUP BY status;"
```

---

## 🔄 Automated Features

Once deployed, the following will run automatically:

| Task | Schedule | Description |
|------|----------|-------------|
| **Event Sync** | Every 3 hours | Syncs new events from WordPress |
| **Event Reminders** | Daily at 9 AM | Sends reminders 24h before events |
| **Follow-up Emails** | Daily at 10 AM | Sends post-event follow-ups |
| **Status Updates** | Daily at midnight | Updates event statuses (ongoing/completed) |
| **Event Cleanup** | Daily at 2 AM | Deletes events older than 30 days |

---

## 🎯 Success Checklist

- [ ] Pushed code to GitHub
- [ ] WordPress plugin installed and activated
- [ ] WordPress permalinks flushed
- [ ] API endpoint tested and working
- [ ] Production server updated (git pull)
- [ ] Docker containers rebuilt and running
- [ ] Old events cleaned from database
- [ ] Initial sync completed successfully
- [ ] Frontend showing correct events
- [ ] All cron jobs scheduled and running

---

## 📞 Support

If you encounter any issues:
1. Check the logs: `docker-compose logs -f backend`
2. Verify database: `docker exec mec-postgres psql -U postgres -d mec_dashboard`
3. Test API endpoint: `curl https://housesoflight.org/wp-json/mec-bridge/v1/events`
4. Review this deployment guide

---

**Last Updated:** October 10, 2025

