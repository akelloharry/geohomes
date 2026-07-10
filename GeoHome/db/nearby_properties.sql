-- GeoHome DB: PostGIS setup, tables, RPC and sample seed data
-- Run in Supabase SQL editor or psql connected to your DB
--
-- If your Supabase database uses a custom schema name such as geohome,
-- run the SQL with an explicit search_path first, or fully qualify the schema.
-- Example:
--
-- SET search_path = 'geohome', public;
--
-- Then run the rest of this file so tables like profiles and properties are created
-- inside the expected schema instead of public.
--
-- NOTE: Column naming:
-- - Properties table uses 'lat' and 'lng' (not 'latitude'/'longitude')
-- - The 'location' column (PostGIS geography) is kept in sync via trigger
-- - If migrating from an older schema with latitude/longitude, they will be renamed

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a dedicated application schema and use it for the GeoHome tables.
CREATE SCHEMA IF NOT EXISTS geohomes;
SET search_path = geohomes, public;

-- Migration: Rename latitude/longitude to lat/lng if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'latitude'
    AND table_schema = 'public' AND is_generated = 'NEVER'
  ) THEN
    EXECUTE 'ALTER TABLE public.properties RENAME COLUMN latitude TO lat';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'longitude'
    AND table_schema = 'public' AND is_generated = 'NEVER'
  ) THEN
    EXECUTE 'ALTER TABLE public.properties RENAME COLUMN longitude TO lng';
  END IF;
END $$;

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  address text,
  price integer,
  deposit integer,
  bedrooms integer,
  bathrooms integer,
  property_type text,
  furnished boolean DEFAULT false,
  water_supply text[],
  electricity text[],
  parking text[],
  security text[],
  backup_power text[],
  internet text[],
  lat double precision,
  lng double precision,
  location GEOGRAPHY(POINT,4326),
  photos text[],
  sponsored boolean DEFAULT false,
  available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  verification_status text DEFAULT 'pending',
  landlord_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ALTER COLUMN verification_status SET DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnished boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_supply text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS security text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS backup_power text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internet text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS photos text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sponsored boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_urls text[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS booked_dates date[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unavailable_dates date[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'water_supply'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE properties ALTER COLUMN water_supply TYPE text[] USING ARRAY[water_supply];
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'electricity'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE properties ALTER COLUMN electricity TYPE text[] USING ARRAY[electricity];
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'parking'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE properties ALTER COLUMN parking TYPE text[] USING ARRAY[parking];
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'backup_power'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE properties ALTER COLUMN backup_power TYPE text[] USING ARRAY[backup_power];
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'internet'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE properties ALTER COLUMN internet TYPE text[] USING ARRAY[internet];
  END IF;
END $$;

-- Trigger to keep location in sync
CREATE OR REPLACE FUNCTION properties_set_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.lng IS NOT NULL AND NEW.lat IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_geom
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION properties_set_geom();

-- Agent submissions table
CREATE TABLE IF NOT EXISTS agent_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid,
  property_type text,
  rent integer,
  deposit integer,
  bedrooms integer,
  bathrooms integer,
  furnished boolean,
  water_supply text,
  electricity text,
  parking text,
  security text[],
  backup_power text,
  internet text,
  lat double precision,
  lng double precision,
  landlord_name text,
  landlord_phone text,
  notes text,
  photos text[],
  property_id uuid,
  status text DEFAULT 'pending_review',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS agent_id uuid;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS water_supply text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS electricity text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS parking text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS backup_power text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS internet text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS landlord_name text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS landlord_phone text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE agent_submissions ADD COLUMN IF NOT EXISTS property_id uuid;

CREATE TABLE IF NOT EXISTS search_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  payment_ref text,
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  paid_amount integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_passes ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE search_passes ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE search_passes ADD COLUMN IF NOT EXISTS payment_ref text;
ALTER TABLE search_passes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE search_passes ADD COLUMN IF NOT EXISTS paid_amount integer;

CREATE INDEX IF NOT EXISTS idx_search_passes_tenant_id ON public.search_passes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_search_passes_session_id ON public.search_passes(session_id);
CREATE INDEX IF NOT EXISTS idx_search_passes_payment_ref ON public.search_passes(payment_ref);

CREATE OR REPLACE FUNCTION has_active_pass(user_id_param uuid, session_id_param text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.search_passes
    WHERE (
      tenant_id = user_id_param
      OR user_id = user_id_param
      OR (session_id IS NOT NULL AND session_id = session_id_param)
    )
      AND expires_at > NOW()
  );
END;
$$;

-- PRIORITY 2 – CORRECTED SPATIAL FUNCTIONS
-- (No photos or sponsored columns in properties table)

-- 1. Drop old versions
DROP FUNCTION IF EXISTS nearby_properties(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS properties_in_bbox(double precision, double precision, double precision, double precision) CASCADE;

-- 2. Corrected nearby_properties (returns empty array for photos, false for sponsored)
CREATE OR REPLACE FUNCTION nearby_properties(lat_param double precision, lng_param double precision, radius integer)
RETURNS TABLE (
  id UUID,
  title TEXT,
  address TEXT,
  price INT,
  deposit INT,
  bedrooms INT,
  bathrooms INT,
  property_type TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location GEOGRAPHY(POINT,4326),
  photos TEXT[],
  sponsored BOOLEAN,
  available BOOLEAN,
  verification_status TEXT,
  landlord_id UUID,
  created_at TIMESTAMPTZ,
  distance DOUBLE PRECISION
) LANGUAGE sql STABLE
AS $$
  SELECT 
    p.id,
    p.title,
    p.address,
    p.price,
    p.deposit,
    p.bedrooms,
    p.bathrooms,
    p.property_type,
    p.lat,
    p.lng,
    p.location,
    COALESCE(p.photos, ARRAY[]::TEXT[]) AS photos,
    COALESCE(p.sponsored, FALSE) AS sponsored,
    p.available,
    p.verification_status,
    p.landlord_id,
    p.created_at,
    ST_Distance(
      COALESCE(p.location, ST_SetSRID(ST_MakePoint(p.lng, p.lat), 4326)::geography),
      ST_SetSRID(ST_MakePoint(lng_param, lat_param), 4326)::geography
    ) AS distance
  FROM properties p
  WHERE p.verification_status = 'verified'
    AND p.available = true
    AND (
      p.location IS NOT NULL
      OR (p.lng IS NOT NULL AND p.lat IS NOT NULL)
    )
    AND ST_DWithin(
      COALESCE(p.location, ST_SetSRID(ST_MakePoint(p.lng, p.lat), 4326)::geography),
      ST_SetSRID(ST_MakePoint(lng_param, lat_param), 4326)::geography,
      radius
    )
  ORDER BY distance
  LIMIT 500;
$$

-- 3. Corrected properties_in_bbox (area search)
CREATE OR REPLACE FUNCTION properties_in_bbox(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  address TEXT,
  price INT,
  deposit INT,
  bedrooms INT,
  bathrooms INT,
  property_type TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location GEOGRAPHY(POINT,4326),
  photos TEXT[],
  sponsored BOOLEAN,
  available BOOLEAN,
  verification_status TEXT,
  landlord_id UUID,
  created_at TIMESTAMPTZ
) LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.title,
    p.address,
    p.price,
    p.deposit,
    p.bedrooms,
    p.bathrooms,
    p.property_type,
    p.lat,
    p.lng,
    p.location,
    COALESCE(p.photos, ARRAY[]::TEXT[]) AS photos,
    COALESCE(p.sponsored, FALSE) AS sponsored,
    p.available,
    p.verification_status,
    p.landlord_id,
    p.created_at
  FROM properties p
  WHERE p.verification_status = 'verified'
    AND p.available = true
    AND (
      p.location IS NOT NULL
      OR (p.lng IS NOT NULL AND p.lat IS NOT NULL)
    )
    AND COALESCE(p.lng, ST_X(p.location::geometry)) BETWEEN min_lng AND max_lng
    AND COALESCE(p.lat, ST_Y(p.location::geometry)) BETWEEN min_lat AND max_lat
  ORDER BY p.created_at DESC
  LIMIT 500;
$$

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Sample seed: properties near Kisumu (lat -0.0917, lng 34.7617)
INSERT INTO properties (title, address, price, deposit, bedrooms, bathrooms, property_type, lat, lng)
VALUES
('Riverside Apartments', 'Along Kisumu River', 15000, 10000, 2, 1, 'rental', -0.0905, 34.7610),
('Campus View Hostel', 'Near University', 8000, 0, 6, 2, 'hostel', -0.0950, 34.7625),
('Cozy BnB', 'Central Kisumu', 5000, 0, 1, 1, 'bnb', -0.0919, 34.7630);

-- Profiles table and trigger for automatic profile creation from auth metadata
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  role text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

CREATE OR REPLACE FUNCTION handle_auth_user_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auth_user_insert ON auth.users;
CREATE TRIGGER auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_auth_user_insert();

-- Inquiries table for viewing requests
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  owner_id uuid,
  landlord_id uuid,
  user_id uuid,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS landlord_id uuid;

CREATE TABLE IF NOT EXISTS viewing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  tenant_id uuid,
  status text DEFAULT 'pending',
  requested_at timestamptz DEFAULT now()
);

-- Transactions / escrow table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  tenant_id uuid,
  owner_id uuid,
  amount integer,
  status text DEFAULT 'held',
  release_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  name text,
  property_type text,
  bedrooms integer,
  bathrooms integer,
  rent_price integer,
  deposit integer,
  is_vacant boolean DEFAULT true,
  available_from date,
  photos text[],
  video_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE units ADD COLUMN IF NOT EXISTS booked_dates date[];

CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  unit_id uuid,
  landlord_id uuid,
  tenant_id uuid,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id uuid,
  content text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE TABLE IF NOT EXISTS property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  user_id uuid,
  viewed_at timestamptz DEFAULT now()
);

-- Minimal Row Level Security policies for client access (adjust for production)
ALTER TABLE IF EXISTS inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "inquiries_select_authenticated" ON inquiries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "inquiries_insert_authenticated" ON inquiries FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "property_views_insert_authenticated" ON property_views FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "property_views_select_authenticated" ON property_views FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "chat_threads_select_authenticated" ON chat_threads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "chat_threads_insert_authenticated" ON chat_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "chat_messages_select_authenticated" ON chat_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "chat_messages_insert_authenticated" ON chat_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
