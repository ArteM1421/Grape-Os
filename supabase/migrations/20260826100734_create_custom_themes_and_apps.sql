/*
# Create custom themes and custom apps tables

1. New Tables
- `custom_themes` — Stores AI-generated themes with all 40 settings as JSON
  - id (uuid, primary key)
  - theme_id (text, unique, not null) — slug identifier
  - name (text, not null)
  - theme_data (jsonb, not null) — full PyOSTheme object
  - created_at (timestamptz)
- `custom_apps` — Stores AI-generated desktop apps
  - id (uuid, primary key)
  - app_id (text, unique, not null) — slug identifier
  - name (text, not null)
  - description (text)
  - icon_name (text) — lucide icon name
  - code (text, not null) — JSX/TSX source code
  - created_at (timestamptz)
2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD (single-tenant, no auth — data is shared/public).
*/

CREATE TABLE IF NOT EXISTS custom_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id text UNIQUE NOT NULL,
  name text NOT NULL,
  theme_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_custom_themes" ON custom_themes;
CREATE POLICY "anon_select_custom_themes" ON custom_themes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_custom_themes" ON custom_themes;
CREATE POLICY "anon_insert_custom_themes" ON custom_themes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_custom_themes" ON custom_themes;
CREATE POLICY "anon_update_custom_themes" ON custom_themes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_custom_themes" ON custom_themes;
CREATE POLICY "anon_delete_custom_themes" ON custom_themes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS custom_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon_name text NOT NULL DEFAULT 'Sparkles',
  code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_custom_apps" ON custom_apps;
CREATE POLICY "anon_select_custom_apps" ON custom_apps FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_custom_apps" ON custom_apps;
CREATE POLICY "anon_insert_custom_apps" ON custom_apps FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_custom_apps" ON custom_apps;
CREATE POLICY "anon_update_custom_apps" ON custom_apps FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_custom_apps" ON custom_apps;
CREATE POLICY "anon_delete_custom_apps" ON custom_apps FOR DELETE
  TO anon, authenticated USING (true);
