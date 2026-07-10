# GeoHome Kenya Database Setup Quick Start

## Problem: 404 errors for `profiles` and `nearby_properties`

Your app is deployed but showing 404 errors from Supabase. This means **the database tables and RPC function haven't been created yet**.

### Fix (5 minutes)

1. Go to your Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste **all** the code from [`db/nearby_properties.sql`](./db/nearby_properties.sql) in this repo
5. Click **Run**
6. Done! Refresh your app and try signing up.

### If you have a custom schema named `geohome`:

1. Go to your Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste this **first**:
   ```sql
   SET search_path = 'geohome', public;
   ```
3. Below that, paste the **entire contents** of [`db/nearby_properties.sql`](./db/nearby_properties.sql)
4. Click **Run**
5. Refresh your app

---

## Checklist

- [ ] Ran the SQL from `db/nearby_properties.sql` in Supabase
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` to Vercel environment variables
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables
- [ ] Added `NEXT_PUBLIC_MAPBOX_TOKEN` to Vercel environment variables
- [ ] Added `NEXT_PUBLIC_SUPABASE_DB_SCHEMA` (set to `public` or `geohome`)
- [ ] Verified Supabase allows new signups (Settings → Authentication)

---

## Still not working?

- **Check browser console** for JavaScript errors
- **Check Supabase logs** (SQL Editor → run `SELECT * FROM profiles LIMIT 1`)
- **Verify tables exist**: In SQL Editor, run `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
- **Open an issue** on GitHub with the console errors

---

For full setup details, see [**DEPLOYMENT.md**](./DEPLOYMENT.md)
