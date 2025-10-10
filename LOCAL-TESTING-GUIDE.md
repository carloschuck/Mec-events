# 🧪 Local Testing Guide - MEC Dashboard

## ✅ Current Status
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:5173
- ✅ Database with 4 events, 21 registrations
- ✅ Demo admin user configured

---

## 🚀 Quick Start

### 1. Access the Dashboard
**Open in browser:** http://localhost:5173

### 2. Login Credentials
```
Email: admin@test.com
Password: admin123
```

---

## 📝 Testing Checklist

### ✅ Phase 1: Authentication
- [ ] Login with test credentials
- [ ] Verify successful redirect to dashboard
- [ ] Check user profile shows correct info
- [ ] Test logout functionality

### ✅ Phase 2: Dashboard Overview
- [ ] **KPI Cards** - Verify stats are displayed:
  - Total Events
  - Total Registrations
  - Check-Ins
  - Check-In Rate %
- [ ] **Charts** - Check visualizations:
  - Events by Status (Pie Chart)
  - Registrations Over Time (Line Chart)
  - Check-Ins by Event (Bar Chart)
- [ ] **Recent Events List** - Should show 4 demo events

### ✅ Phase 3: Events Page
- [ ] View all events in table format
- [ ] Test search functionality
- [ ] Test status filter (All/Upcoming/Active/Past/Cancelled)
- [ ] Verify pagination works
- [ ] Click on an event to view details

### ✅ Phase 4: Event Detail Page
**For each demo event, test:**

#### Event Information
- [ ] Event header displays correctly (title, date, location)
- [ ] Status badge shows correct state
- [ ] Capacity and attendance numbers accurate

#### Tabs
- [ ] **Overview Tab:**
  - [ ] Event description visible
  - [ ] Quick stats cards showing correctly
  - [ ] Event metadata (organizer, contact, etc.)

- [ ] **Attendees Tab:**
  - [ ] Attendee list with all registrations
  - [ ] Search attendees by name/email
  - [ ] Filter by check-in status
  - [ ] Pagination working

- [ ] **Analytics Tab:**
  - [ ] Registration timeline chart
  - [ ] Check-in rate statistics
  - [ ] Demographics data (if available)

#### Actions
- [ ] **Export PDF** - Download event report
- [ ] **Export CSV** - Download attendee list
- [ ] **Sync with MEC** button (will show "Not configured" - expected)

### ✅ Phase 5: Check-In System
- [ ] Navigate to Check-In page
- [ ] Select an event from dropdown
- [ ] Test QR Scanner:
  - [ ] Camera permission requested
  - [ ] Scanner interface loads
  - [ ] Manual entry option available
- [ ] Try manual check-in with registration ID
- [ ] Verify success/error messages

### ✅ Phase 6: User Profile
- [ ] View profile information
- [ ] Check role is displayed correctly (Admin)
- [ ] Verify created date shows
- [ ] Test any profile edit features

### ✅ Phase 7: API Endpoints (Backend Testing)
Test these endpoints in browser or Postman:

#### Health Check
```
GET http://localhost:3001/api/health
```
Expected: `{ success: true, status: "healthy" }`

#### Login
```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}
```
Expected: Returns token and user data

#### Events List (requires auth token)
```
GET http://localhost:3001/api/events
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Dashboard Stats (requires auth token)
```
GET http://localhost:3001/api/dashboard/stats
Authorization: Bearer YOUR_TOKEN_HERE
```

#### Test MEC Connection (requires auth token)
```
GET http://localhost:3001/api/events/test-mec
Authorization: Bearer YOUR_TOKEN_HERE
```
Expected: Shows MEC API connection status

---

## 🎨 Demo Events Overview

### Event 1: Tech Conference 2024
- **Status:** Upcoming
- **Date:** Nov 15, 2025
- **Location:** San Francisco Convention Center
- **Capacity:** 500
- **Registrations:** 8

### Event 2: Marketing Workshop
- **Status:** Active
- **Date:** Oct 20, 2025
- **Location:** Downtown Workshop Space
- **Capacity:** 50
- **Registrations:** 5

### Event 3: Design Summit
- **Status:** Past
- **Date:** Sep 10, 2025
- **Location:** Creative Arts Center
- **Capacity:** 200
- **Registrations:** 6

### Event 4: Product Launch
- **Status:** Cancelled
- **Date:** Dec 1, 2025
- **Location:** Tech Hub Auditorium
- **Capacity:** 300
- **Registrations:** 2

---

## 🐛 Known Limitations (Demo Mode)

### Expected Behaviors:
1. **MEC API Sync** - Will show "Not configured" or fail (expected - no live API)
2. **QR Check-In** - Works but generates demo QR codes
3. **Email Notifications** - Requires SMTP configuration
4. **Webhooks** - Only work with public URL (ngrok or production)

---

## 🎯 Key Features to Highlight

### 1. **Real-Time Statistics**
- Dashboard shows live counts and percentages
- Auto-calculated check-in rates
- Visual charts for quick insights

### 2. **Responsive Design**
- Test on mobile/tablet sizes
- Navigation adapts to screen size
- Tables scroll horizontally on small screens

### 3. **Search & Filter**
- Fast client-side search
- Multiple filter options
- Pagination for large datasets

### 4. **Export Capabilities**
- PDF reports with event details
- CSV exports for data analysis
- Formatted and ready to share

### 5. **QR Code System**
- Each registration gets unique QR code
- Scanner validates and records check-ins
- Manual entry backup option

---

## 📊 Performance Testing

### Things to Check:
- [ ] Page load times (should be < 2 seconds)
- [ ] API response times (check browser Network tab)
- [ ] Chart rendering performance
- [ ] Table sorting/filtering speed
- [ ] PDF generation time

---

## 🔍 Browser Developer Tools

### Recommended Checks:

#### Console Tab
- [ ] No JavaScript errors
- [ ] No 404 errors for assets
- [ ] API calls successful (200 responses)

#### Network Tab
- [ ] API requests return in < 500ms
- [ ] No failed requests
- [ ] Proper auth headers sent

#### Application Tab
- [ ] Token stored in localStorage
- [ ] No sensitive data exposed

---

## 🚨 Common Issues & Fixes

### Issue: "Cannot connect to backend"
**Fix:** Ensure backend is running on port 3001
```bash
cd backend && npm run dev
```

### Issue: "Invalid credentials"
**Fix:** Use exact credentials:
- Email: `admin@test.com`
- Password: `admin123`

### Issue: "No events displayed"
**Fix:** Run demo seed script:
```bash
cd backend && npm run seed:demo
```

### Issue: QR Scanner not working
**Fix:** 
- Allow camera permissions in browser
- Use HTTPS or localhost only
- Try manual entry as backup

---

## ✅ Testing Complete Checklist

After completing all tests above:

- [ ] All pages load without errors
- [ ] Authentication works correctly
- [ ] Dashboard shows accurate statistics
- [ ] Events list and details display properly
- [ ] Check-in system functional
- [ ] Export features work (PDF/CSV)
- [ ] No console errors in browser
- [ ] Mobile responsive layout works
- [ ] API endpoints respond correctly
- [ ] User experience is smooth and intuitive

---

## 🚀 Next Steps After Local Testing

Once local testing is complete:

1. **Document any issues found**
2. **Take screenshots of key features**
3. **Test with real MEC API (if available)**
4. **Prepare for DigitalOcean deployment**
5. **Configure production environment variables**

---

## 📞 Support

If you encounter any issues during testing:
1. Check browser console for errors
2. Review backend logs in terminal
3. Verify all services are running
4. Check this guide for common fixes

---

**Happy Testing! 🎉**

*Last Updated: October 10, 2025*

