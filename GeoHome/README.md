# GeoHome Kenya — MVP

This is a Next.js (App Router) starter scaffold for the GeoHome Kenya MVP.

Key pieces:
- Next.js 14 App Router structure under `app/`
- Supabase client and `AuthContext`
- Mapbox GL JS map component
- Tailwind CSS for styling
- Mock M-Pesa STK Push route at `/api/mpesa/stkpush`

Quick start:

1. Copy `.env.local` values and set real credentials.
2. Ensure `.env.local` is not committed to git (it is listed in `.gitignore`).
3. Install dependencies:

```bash
pnpm install
# or npm install
```

3. Run dev:

```bash
pnpm dev
```

Database setup (Supabase/Postgres with PostGIS):

1. Open the Supabase SQL editor or connect with psql and run the SQL in `db/nearby_properties.sql` to create tables, trigger, RPC and seed data.

2. The RPC function `nearby_properties(lat, lng, radius)` is used by the tenant search page to fetch verified properties within a radius (meters).

Example using psql:

```bash
# from a machine with psql and DATABASE_URL set
psql $DATABASE_URL -f db/nearby_properties.sql
```

M-Pesa (Daraja) notes:
- You provided `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` in `.env.local`.
- `MPESA_PASSKEY` and `MPESA_SHORTCODE` are currently set to `N/A` — STK Push cannot run against Daraja without valid merchant shortcode and passkey.
- I added server routes:
  - `GET /api/mpesa/token` — exchanges consumer key/secret for an OAuth token against the Safaricom sandbox.
  - `POST /api/mpesa/stkpush` — will attempt a real STK Push if `MPESA_PASSKEY` and `MPESA_SHORTCODE` are configured; otherwise returns a mock response and logs the payload.

To enable live STK Push testing, set `MPESA_PASSKEY` and `MPESA_SHORTCODE` in `.env.local` with values from your Safaricom Daraja account (or sandbox credentials).

Additional app notes:
- The tenant search page uses `nearby_properties(lat, lng, radius)` to fetch nearby verified listings.
- Landlords can add new properties at `/properties/new`.
- Admins can review agent submissions, view all properties, and promote users via `/admin`.
- Make sure to create Supabase storage buckets such as `agent-uploads` and `property-photos` for uploads.
