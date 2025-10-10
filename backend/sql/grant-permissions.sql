-- Grant permissions for DigitalOcean Managed Database
-- Run this SQL as the database admin/owner

-- Grant all privileges on schema public to the app database user
GRANT ALL PRIVILEGES ON SCHEMA public TO "mec-postgres-db";

-- Grant privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "mec-postgres-db";

-- Grant privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "mec-postgres-db";

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON TABLES TO "mec-postgres-db";

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON SEQUENCES TO "mec-postgres-db";

-- Verify permissions
\du "mec-postgres-db"

