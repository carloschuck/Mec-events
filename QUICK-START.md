# 🚀 Quick Start - MEC Events App

## Your App Is Deploying! ⏳

**App Dashboard**: https://cloud.digitalocean.com/apps/a72e86c7-1cad-4633-a09a-2ec2a4365a45

Expected deployment time: **5-10 minutes**

---

## ✅ Immediate Actions (After Deployment)

### 1. Get Your App URL
Visit your dashboard and copy the app URL (format: `https://mec-events-app-xxxxx.ondigitalocean.app`)

### 2. Create Admin User
```bash
# From DigitalOcean Console (Apps > mec-events-app > backend > Console)
npm run seed
```
**Default Credentials**:
- Email: admin@housesoflight.org
- Password: Admin123!

### 3. Configure WordPress Webhook
In WordPress (**Settings > MEC Webhook Bridge**):
- **URL**: `https://your-app-url.ondigitalocean.app/api/webhook/mec`
- **Secret**: `juzl3DuBkbGej3c7+BTWVKdQIydUJuVZJrMld4GlZac=`

---

## 📱 Quick Links

| What | Where |
|------|-------|
| **View App** | https://your-app-url.ondigitalocean.app |
| **Manage App** | https://cloud.digitalocean.com/apps/a72e86c7-1cad-4633-a09a-2ec2a4365a45 |
| **View Logs** | Dashboard > Runtime Logs |
| **Environment Vars** | Dashboard > Settings > Environment Variables |

---

## 🔧 What's Configured

✅ Backend API (Node.js + Express)  
✅ Frontend (React + Vite)  
✅ PostgreSQL 15 Database  
✅ Multi-site webhook support  
✅ JWT authentication  
✅ Auto-deploy on git push  

❌ SMTP Email (add later if needed)

---

## 🎯 Test Your Deployment

### 1. Health Check
```bash
curl https://your-app-url.ondigitalocean.app/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Login to Dashboard
1. Go to `https://your-app-url.ondigitalocean.app`
2. Login with admin credentials
3. You should see the dashboard

### 3. Test Webhook
In WordPress plugin settings, click **"Test Connection"**

---

## 📚 Full Documentation

- **Complete Guide**: See `DEPLOYMENT-SUMMARY.md`
- **Multi-Site Setup**: See `MULTI-SITE-SETUP.md`
- **Troubleshooting**: Check runtime logs in dashboard

---

## 💡 Pro Tips

1. **Change Admin Password**: Do this immediately after first login
2. **Enable SMTP**: Add email settings for event reminders
3. **Monitor Logs**: Check for any errors during first sync
4. **Test Webhooks**: Create a test event in WordPress to verify sync

---

**Need Help?** Check the deployment logs first - they usually tell you what's wrong!

