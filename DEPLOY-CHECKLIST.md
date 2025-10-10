# DigitalOcean Deployment Checklist

Quick checklist for deploying to DigitalOcean App Platform.

## 🎯 Pre-Deployment (Do These First!)

### 1. Update App Spec File

Edit `.do/app.yaml` and replace these values:

```yaml
# Line 16, 32, 73 - Replace with YOUR GitHub username
github:
  repo: yourgithubusername/Mec-events  # ← CHANGE THIS
```

### 2. Generate Secrets

Run these commands to generate secure secrets:

```bash
# Generate JWT Secret
echo "JWT_SECRET=$(openssl rand -base64 32)"

# Generate Webhook Secret  
echo "WEBHOOK_SECRET=$(openssl rand -base64 32)"
```

Copy these values and update in `.do/app.yaml`:
- Lines 43-44: JWT_SECRET
- Lines 49-50: WEBHOOK_SECRET

### 3. Configure Email

Update in `.do/app.yaml` (lines 62-71):

```yaml
- key: SMTP_USER
  value: your-email@gmail.com  # ← YOUR EMAIL
  
- key: SMTP_PASS
  value: your-gmail-app-password  # ← YOUR APP PASSWORD
  
- key: EMAIL_FROM
  value: MEC Dashboard <your-email@gmail.com>  # ← YOUR EMAIL
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character password

### 4. Commit Changes

```bash
git add .do/app.yaml
git commit -m "Configure DigitalOcean deployment with secrets"
git push origin main
```

## 🚀 Deployment Steps

### Step 1: Create App on DigitalOcean

1. ✅ Go to https://cloud.digitalocean.com
2. ✅ Click **"Apps"** in sidebar
3. ✅ Click **"Create App"**
4. ✅ Select **"GitHub"**
5. ✅ Authorize DigitalOcean
6. ✅ Select repository: **Mec-events**
7. ✅ Select branch: **main**
8. ✅ Check **"Autodeploy on push"**
9. ✅ Click **"Next"**

### Step 2: Import App Spec

1. ✅ Click **"Edit App Spec"** button
2. ✅ Delete all existing content
3. ✅ Copy entire contents of `.do/app.yaml`
4. ✅ Paste into the editor
5. ✅ Click **"Save"**
6. ✅ Click **"Next"**

### Step 3: Select Region

1. ✅ Select region: **San Francisco 3 (SFO3)**
2. ✅ Click **"Next"**

### Step 4: Review & Deploy

1. ✅ Review configuration:
   - Backend service ✓
   - Frontend service ✓
   - PostgreSQL database ✓
   - DB setup job ✓

2. ✅ Verify pricing: ~$17/month minimum
   - Backend: $5/month
   - Frontend: $5/month
   - Database: $7/month

3. ✅ Click **"Create Resources"**

### Step 5: Wait for Deployment (~10-15 minutes)

Monitor progress:
- ✅ Database provisioning (2-3 min)
- ✅ Backend building (5-10 min)
- ✅ Frontend building (3-5 min)
- ✅ Post-deploy job (seed database) (1-2 min)

### Step 6: Get Your URLs

After deployment completes, note your URLs:

```
Frontend: https://mec-events-xxxxx.ondigitalocean.app
Backend:  https://mec-events-xxxxx-backend.ondigitalocean.app
```

## ✅ Post-Deployment

### 1. Test Backend Health

```bash
curl https://mec-events-xxxxx-backend.ondigitalocean.app/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 2. Update CLIENT_URL

1. Go to your App → Backend component
2. Settings → Environment Variables
3. Find `CLIENT_URL`
4. Update to your **frontend URL**
5. Click Save
6. Redeploy backend

### 3. Access Dashboard

1. Open your frontend URL in browser
2. Login with demo credentials:
   - **Email**: `admin@example.com`
   - **Password**: `admin123`

### 4. ⚠️ CRITICAL: Change Admin Password

1. Go to Profile (top right)
2. Click "Change Password"
3. Set a strong new password
4. Save

### 5. Configure WordPress Plugin

1. Upload `wordpress-plugin/mec-webhook-bridge.php` to WordPress
2. Activate plugin
3. Go to `Settings → MEC Webhook Bridge`
4. Configure:
   ```
   Webhook URL: https://mec-events-xxxxx-backend.ondigitalocean.app/api/webhooks/mec
   Webhook Secret: <your-webhook-secret-from-step-2>
   ```
5. ☑ Enable webhooks
6. Click "Save Changes"

### 6. Test Webhook

1. In WordPress plugin settings, click **"Send Test Webhook"**
2. Should see: ✅ Success message
3. Check DigitalOcean backend logs for confirmation

## 🔒 Security Tasks

- [ ] Changed admin password from default
- [ ] Saved JWT_SECRET securely
- [ ] Saved WEBHOOK_SECRET securely
- [ ] Saved database credentials (in DO dashboard)
- [ ] Saved frontend & backend URLs
- [ ] Tested webhook connectivity
- [ ] Verified email sending works

## 📊 Next Steps

- [ ] Create staff user accounts
- [ ] Install plugin on all WordPress sites (if multi-site)
- [ ] Test event creation and sync
- [ ] Test QR code check-in
- [ ] Configure uptime monitoring
- [ ] Set up database alerts
- [ ] Document credentials in secure location

## 🐛 Common Issues

### "Database Connection Failed"

**Solution**: Database takes 2-3 minutes to provision. Wait and check:
- Database status is "Active" in DigitalOcean
- Backend logs show database connection

### "Webhook Test Failed"

**Solution**: Check:
- Backend is deployed and running
- Webhook URL is correct
- Webhook secret matches in both places
- Backend logs for error messages

### "Cannot Login"

**Solution**: Check:
- Post-deploy job completed successfully
- Database was seeded (check job logs)
- Try default credentials: admin@example.com / admin123

### "Build Failed"

**Solution**: Check build logs for:
- Missing dependencies
- Syntax errors
- Environment variable issues

## 💰 Cost Summary

**Minimum Configuration: ~$17/month**
- Backend (Basic XXS): $5/month
- Frontend (Basic XXS): $5/month  
- Database (Basic Dev): $7/month

**Recommended Production: ~$39/month**
- Backend (Basic XS): $12/month
- Frontend (Basic XXS): $5/month
- Database (Basic Production): $15/month
- Backups: $7/month

## 📞 Need Help?

- **Full Guide**: See `DIGITALOCEAN-DEPLOYMENT-GUIDE.md`
- **Multi-Site Setup**: See `MULTI-SITE-SETUP.md`
- **General Deployment**: See `DEPLOYMENT.md`
- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/

---

**🎉 Ready to Deploy!**

Once you've completed the pre-deployment checklist above, you're ready to deploy to DigitalOcean App Platform.

**Estimated Time**: 15-20 minutes total
**Cost**: Starting at $17/month
**Difficulty**: Easy (fully automated)

