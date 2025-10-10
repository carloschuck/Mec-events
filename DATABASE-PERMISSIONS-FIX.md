# Database Permissions Fix for DigitalOcean

## Problem
```
Error: permission denied for schema public
```

This error occurs because DigitalOcean managed database users don't have CREATE permissions by default.

---

## Quick Fix Options

### Option 1: Grant Permissions via DigitalOcean Console (Recommended)

1. **Access the Database Console**:
   - Go to: https://cloud.digitalocean.com/databases
   - Click on your `mec-postgres-db` database
   - Go to **Users & Databases** tab
   - Click **Connection Details** and copy the connection string

2. **Connect via Console**:
   - In the database dashboard, click **Console** tab (or use `psql` locally)
   
3. **Run the Permission Grant**:
   ```sql
   GRANT ALL PRIVILEGES ON SCHEMA public TO "mec-postgres-db";
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "mec-postgres-db";
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "mec-postgres-db";
   
   ALTER DEFAULT PRIVILEGES IN SCHEMA public 
   GRANT ALL PRIVILEGES ON TABLES TO "mec-postgres-db";
   
   ALTER DEFAULT PRIVILEGES IN SCHEMA public 
   GRANT ALL PRIVILEGES ON SEQUENCES TO "mec-postgres-db";
   ```

4. **Trigger a Redeploy**:
   - Go back to your App Platform dashboard
   - Click **Actions** > **Force Rebuild and Deploy**

---

### Option 2: Use the SQL File

1. **Download the SQL file** from your repo:
   ```bash
   backend/sql/grant-permissions.sql
   ```

2. **Run it on your database**:
   ```bash
   # Via psql
   psql -h your-db-host -U doadmin -d mec-postgres-db -f grant-permissions.sql
   ```

3. **Redeploy your app**

---

### Option 3: Create a Superuser (Alternative)

If the above doesn't work, create a new database user with full permissions:

1. **Via DigitalOcean Console**:
   - Go to database > Users & Databases
   - Create a new user with superuser role

2. **Update your app environment variables**:
   - Go to App Platform > Settings > Environment Variables
   - Update `DB_USER` and `DB_PASSWORD` to use the new user
   - Redeploy

---

## After Granting Permissions

Once permissions are granted, you need to initialize the database:

### Method 1: Via App Platform Console

1. Go to Apps > mec-events-app > backend > **Console**
2. Run:
   ```bash
   npm run init-db
   ```

### Method 2: Automatic on Next Deploy

The app will automatically try to create tables on the next deployment.

---

## Verify the Fix

After granting permissions and redeploying:

1. **Check deployment logs**:
   - Look for: `✅ Database models synchronized`
   
2. **Test the health endpoint**:
   ```bash
   curl https://your-app-url.ondigitalocean.app/api/health
   ```

3. **Verify tables were created**:
   ```sql
   \dt
   ```
   Should show: `events`, `registrations`, `users` tables

---

## Understanding the Issue

DigitalOcean managed databases have security restrictions:
- Default users don't have CREATE permissions
- This prevents apps from auto-creating tables
- You must explicitly grant permissions

This is actually a security feature, but it requires a one-time setup step.

---

## Alternative: Skip Auto-Sync

If you prefer to manage database schema manually:

1. **Set environment variable**:
   - Add `DB_SKIP_SYNC=true` in App Platform settings

2. **Manually run migrations**:
   ```bash
   npm run init-db
   ```

---

## Need More Help?

1. **Check the database connection**:
   ```bash
   # In backend console
   node -e "import('./src/config/database.js').then(({default: db}) => db.authenticate().then(() => console.log('Connected!')).catch(console.error))"
   ```

2. **Review logs**:
   - App Platform > Runtime Logs
   - Look for database connection errors

3. **Verify environment variables**:
   - Ensure all `DB_*` variables are set correctly
   - Check that SSL is enabled (we added this fix)

---

## Summary

**The fix is simple**:
1. Grant permissions via DigitalOcean database console
2. Redeploy your app
3. Tables will be created automatically

Total time: **~5 minutes**

