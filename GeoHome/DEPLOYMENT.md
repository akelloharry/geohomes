# GeoHome Kenya - Deployment Guide

## Overview
GeoHome Kenya is a Next.js app with Supabase authentication and PostGIS geospatial queries. This guide covers local development and production deployment on Vercel.

---

## 1. Local Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- A Supabase project (free tier at https://supabase.com)

### Steps

```bash
# Clone the repo
git clone https://github.com/akelloharry/geohome.git
cd geohome

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
```

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_SUPABASE_DB_SCHEMA=public
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_MAPBOX_TOKEN
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
```

**Get these from:**
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API → Service Role Key
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox → Account → Tokens

---

## 2. Database Setup (Critical - Do This First)

The 404 errors you're seeing mean the database tables and RPC functions don't exist yet.

### Option A: Standard Setup (`public` schema)

1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `db/nearby_properties.sql`
4. Click "Run"

This creates:
- `properties` table (for rental listings)
- `profiles` table (auto-created on user signup via trigger)
- `agent_submissions` table
- `search_passes` table
- `nearby_properties()` RPC function (PostGIS distance query)
- Auto-profile creation trigger

### Option B: Custom Schema (`geohome`)

If your Supabase project uses a custom schema named `geohome`:

1. Open Supabase Dashboard → SQL Editor
2. Create a new query and paste:
   ```sql
   SET search_path = 'geohome', public;
   ```
3. Copy and paste the full contents of `db/nearby_properties.sql` below that
4. Click "Run"

**Important:** Keep both lines together in one query for it to work.

---

## 3. Row-Level Security (RLS) - Optional but Recommended

Add RLS policies to protect user data:

```sql
-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Enable RLS on properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified properties
CREATE POLICY "Anyone reads verified properties"
  ON properties
  FOR SELECT
  USING (verification_status = 'verified');

-- Landlords can update their own properties
CREATE POLICY "Landlords update own properties"
  ON properties
  FOR UPDATE
  USING (auth.uid() = owner_id);
```

---

## 4. Local Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

**Flow:**
1. Sign up with email, password, full name, phone, and role
2. Check your email for confirmation link
3. Return and log in
4. You'll be redirected based on your role:
   - Tenant → Home (map page)
   - Landlord → `/dashboard`
   - Agent → `/agent`
   - Admin → `/admin`

---

## 5. Deployment to Vercel

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account with repo pushed

### Steps

1. **Connect GitHub repo to Vercel:**
   - Go to https://vercel.com/new
   - Select "Import Git Repository"
   - Choose your `geohome` repo
   - Click "Import"

2. **Configure Environment Variables:**
   - In Vercel Project Settings → Environment Variables, add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
     NEXT_PUBLIC_SUPABASE_DB_SCHEMA=public
     NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_MAPBOX_TOKEN
     SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
     ```

3. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is now live!

4. **Update Supabase CORS (optional for better security):**
   - Supabase Dashboard → Settings → API → CORS Allowed Origins
   - Add your Vercel domain (e.g., `https://geohome-plum.vercel.app`)

---

## 6. Troubleshooting

### Error: `Failed to load resource: 404` for `/rest/v1/profiles`
**Cause:** The `profiles` table doesn't exist in your database.
**Fix:** Run the SQL from `db/nearby_properties.sql` (see Section 2).

### Error: `Failed to load resource: 404` for `/rpc/nearby_properties`
**Cause:** The `nearby_properties()` function doesn't exist.
**Fix:** Run the SQL from `db/nearby_properties.sql` (see Section 2).

### Error: `422` on signup
**Cause:** Supabase auth settings or missing auth trigger.
**Fix:** 
- Verify Supabase project allows new signups (Settings → Authentication)
- Check that the `handle_auth_user_insert` trigger exists and is enabled

### Error: Users not redirected after login
**Cause:** `profile.role` is not loading from the database.
**Fix:**
- Check that `profiles` table exists
- Verify auth trigger is running (test by creating a new user and checking the profiles table)
- Check browser console for errors in AuthContext

### Mapbox map not loading
**Cause:** Missing or invalid `NEXT_PUBLIC_MAPBOX_TOKEN`.
**Fix:**
- Generate a token at https://account.mapbox.com/tokens/
- Add to environment variables and redeploy

---

## 7. Architecture Overview

```
geohome/
├── app/
│   ├── page.js                 # Homepage (map, tenant view)
│   ├── signup/page.js          # User signup
│   ├── login/page.js           # User login
│   ├── dashboard/page.js       # Landlord dashboard
│   ├── agent/page.js           # Agent submission form
│   ├── admin/page.js           # Admin panel
│   ├── properties/
│   │   ├── [id]/page.js        # Property detail view
│   │   └── new/page.js         # Landlord add property
│   └── api/                    # Server routes (M-Pesa, admin)
├── components/
│   ├── Map.js                  # Mapbox GL JS map
│   ├── NearbySearch.js         # RPC search component
│   ├── PropertyCard.js         # Property listing card
│   ├── Navbar.js               # Navigation
│   └── ProtectedRoute.js       # Role-based access control
├── context/
│   └── AuthContext.js          # Supabase auth state
├── lib/
│   └── supabaseClient.js       # Supabase client config
├── db/
│   └── nearby_properties.sql   # Database schema and seed
├── styles/
│   └── globals.css             # Tailwind + custom CSS
└── package.json
```

---

## 8. Key Features

### Authentication
- Email/password signup with role selection (tenant, landlord, agent, admin)
- Automatic profile creation via Supabase auth trigger
- Role-based redirects after login

### Map Integration
- Mapbox GL JS for interactive mapping
- Drag-to-place pin for location selection
- Property markers with dynamic colors (sponsored, available, unavailable)

### Geospatial Search
- PostGIS `nearby_properties()` RPC function
- Distance calculation in meters
- Configurable search radius (1–5 km)

### Landlord Dashboard
- Add and manage rental properties
- Track inquiries and transactions
- View pending property reviews

### Admin Panel
- Manage user roles
- Review agent property submissions
- Verify and approve listings

---

## 9. Database Schema

### profiles
```
id (uuid, PK)
full_name (text)
phone (text)
role (text: tenant, landlord, agent, admin)
created_at (timestamptz)
```

### properties
```
id (uuid, PK)
title (text)
address (text)
price (integer)
deposit (integer)
bedrooms (integer)
bathrooms (integer)
property_type (text: rental, hostel, bnb)
latitude, longitude (double precision)
geom (geography: PostGIS point)
photos (text[], URLs)
sponsored (boolean)
available (boolean)
verification_status (text: pending_review, verified, rejected)
owner_id (uuid, FK to auth.users)
created_at (timestamptz)
```

### nearby_properties() RPC
```
Input:  lat (double), lng (double), radius (integer meters)
Output: properties + distance (in meters)
Filter: verified=true, available=true, geom IS NOT NULL
Limit:  500 results, ordered by distance
```

---

## 10. Support & Next Steps

- **Questions?** Check the GitHub issues or contact the team.
- **Deploy M-Pesa integration?** See `app/api/mpesa/stkpush/route.js` for setup.
- **Customize theme?** Edit `tailwind.config.js` and `app/layout.js`.

---

**Deployed:** https://geohome-plum.vercel.app
**GitHub:** https://github.com/akelloharry/geohome
