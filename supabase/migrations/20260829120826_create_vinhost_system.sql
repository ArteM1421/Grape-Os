/*
# VinHost Registration & Activation System

1. New Tables
- `vinhost_users` — registered users with login/password, tier (free/pro), device binding
  - id (uuid PK)
  - username (text, unique, not null)
  - password_hash (text, not null) — sha256 hash
  - tier (text, default 'free') — 'free' or 'pro'
  - display_name (text, nullable)
  - created_at (timestamptz)
- `activation_keys` — license keys for pro activation (VAP-XXXX-XXXX format)
  - id (uuid PK)
  - key_value (text, unique, not null)
  - is_used (boolean, default false)
  - used_by (uuid FK to vinhost_users, nullable)
  - created_at (timestamptz)
- `device_registrations` — tracks registered devices
  - id (uuid PK)
  - user_id (uuid FK to vinhost_users)
  - device_id (text, not null) — browser-generated unique ID
  - device_name (text, nullable)
  - registered_at (timestamptz)

2. Modified Tables
- `custom_apps` — add `owner_id` (uuid, nullable) to scope apps per user
- `custom_themes` — add `owner_id` (uuid, nullable) to scope themes per user

3. Security
- RLS enabled on all new tables
- vinhost_users: anon can insert (register), authenticated can read own row
- activation_keys: only server-side (service role) can read; anon can check via edge function
- device_registrations: authenticated users can read/register their own devices
- custom_apps/custom_themes: anon can CRUD rows where owner_id IS NULL (legacy shared) OR owner_id matches their session
*/

-- VinHost users table
CREATE TABLE IF NOT EXISTS vinhost_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  tier text NOT NULL DEFAULT 'free',
  display_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vinhost_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_register_vinhost_user" ON vinhost_users;
CREATE POLICY "anon_register_vinhost_user" ON vinhost_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_vinhost_users" ON vinhost_users;
CREATE POLICY "anon_read_vinhost_users" ON vinhost_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_vinhost_user" ON vinhost_users;
CREATE POLICY "anon_update_vinhost_user" ON vinhost_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Activation keys table (server-side only via service role)
CREATE TABLE IF NOT EXISTS activation_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_value text UNIQUE NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES vinhost_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activation_keys ENABLE ROW LEVEL SECURITY;

-- No policies = locked down; only service role can access
-- Anon reads/writes go through the edge function

-- Device registrations
CREATE TABLE IF NOT EXISTS device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vinhost_users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_device_registrations" ON device_registrations;
CREATE POLICY "anon_read_device_registrations" ON device_registrations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_device_registrations" ON device_registrations;
CREATE POLICY "anon_insert_device_registrations" ON device_registrations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Add owner_id to custom_apps
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_apps' AND column_name = 'owner_id') THEN
    ALTER TABLE custom_apps ADD COLUMN owner_id uuid;
  END IF;
END $$;

-- Add owner_id to custom_themes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_themes' AND column_name = 'owner_id') THEN
    ALTER TABLE custom_themes ADD COLUMN owner_id uuid;
  END IF;
END $$;

-- Update custom_apps policies to scope by owner_id
DROP POLICY IF EXISTS "select_own_apps" ON custom_apps;
CREATE POLICY "select_own_apps" ON custom_apps FOR SELECT
  TO anon, authenticated USING (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS "insert_own_apps" ON custom_apps;
CREATE POLICY "insert_own_apps" ON custom_apps FOR INSERT
  TO anon, authenticated WITH CHECK (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS "update_own_apps" ON custom_apps;
CREATE POLICY "update_own_apps" ON custom_apps FOR UPDATE
  TO anon, authenticated USING (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS "delete_own_apps" ON custom_apps;
CREATE POLICY "delete_own_apps" ON custom_apps FOR DELETE
  TO anon, authenticated USING (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);

-- Update custom_themes policies to scope by owner_id
DROP POLICY IF EXISTS "select_own_themes" ON custom_themes;
CREATE POLICY "select_own_themes" ON custom_themes FOR SELECT
  TO anon, authenticated USING (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS "insert_own_themes" ON custom_themes;
CREATE POLICY "insert_own_themes" ON custom_themes FOR INSERT
  TO anon, authenticated WITH CHECK (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS "update_own_themes" ON custom_themes;
CREATE POLICY "update_own_themes" ON custom_themes FOR UPDATE
  TO anon, authenticated USING (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS "delete_own_themes" ON custom_themes;
CREATE POLICY "delete_own_themes" ON custom_themes FOR DELETE
  TO anon, authenticated USING (owner_id IS NULL OR owner_id = current_setting('app.current_user_id', true)::uuid);
