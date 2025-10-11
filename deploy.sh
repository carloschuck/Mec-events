#!/bin/bash

# Production Deployment Script for MEC Events Dashboard
# This script automates the deployment process on your production server

set -e  # Exit on error

echo "🚀 Starting MEC Events Dashboard Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pull latest changes
echo -e "${BLUE}📥 Step 1: Pulling latest changes from Git...${NC}"
git pull origin main
echo -e "${GREEN}✅ Git pull completed${NC}"
echo ""

# Step 2: Stop containers
echo -e "${BLUE}🛑 Step 2: Stopping containers...${NC}"
docker-compose down
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Step 3: Rebuild backend
echo -e "${BLUE}🔨 Step 3: Rebuilding backend container...${NC}"
docker-compose build --no-cache backend
echo -e "${GREEN}✅ Backend rebuilt${NC}"
echo ""

# Step 4: Start containers
echo -e "${BLUE}🚀 Step 4: Starting containers...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Step 5: Wait for services to be ready
echo -e "${BLUE}⏳ Step 5: Waiting for services to be ready...${NC}"
sleep 10
echo -e "${GREEN}✅ Services ready${NC}"
echo ""

# Step 6: Check container status
echo -e "${BLUE}📊 Step 6: Checking container status...${NC}"
docker-compose ps
echo ""

# Step 7: Show recent logs
echo -e "${BLUE}📋 Step 7: Recent backend logs:${NC}"
docker-compose logs --tail=20 backend
echo ""

# Step 8: Optional - Clean old events (prompt user)
echo -e "${YELLOW}🧹 Do you want to clean up old events from the database? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${BLUE}Cleaning up old events...${NC}"
    docker exec mec-postgres psql -U postgres -d mec_dashboard -c "DELETE FROM events WHERE \"startDate\" < NOW() - INTERVAL '1 day';"
    echo -e "${GREEN}✅ Old events cleaned${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping cleanup${NC}"
fi
echo ""

# Step 9: Trigger sync
echo -e "${YELLOW}🔄 Do you want to trigger an immediate event sync? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${BLUE}Triggering event sync...${NC}"
    curl -X POST http://localhost:5000/api/mec-api/sync/events
    echo ""
    echo -e "${GREEN}✅ Sync completed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping sync (will run automatically every 3 hours)${NC}"
fi
echo ""

# Step 10: Summary
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Verify deployment:${NC}"
echo "  • Frontend: Check your dashboard URL"
echo "  • API: curl http://localhost:5000/api/health"
echo "  • Logs: docker-compose logs -f backend"
echo "  • Database: docker exec mec-postgres psql -U postgres -d mec_dashboard"
echo ""
echo -e "${BLUE}🤖 Automated jobs running:${NC}"
echo "  • Event sync: Every 3 hours"
echo "  • Event reminders: Daily at 9 AM"
echo "  • Follow-up emails: Daily at 10 AM"
echo "  • Status updates: Daily at midnight"
echo "  • Event cleanup: Daily at 2 AM"
echo ""
echo -e "${GREEN}✨ All done! Your production site is updated.${NC}"

