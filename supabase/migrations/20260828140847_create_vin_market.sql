/*
# Create Vin Market tables

1. New Tables
- `vin_market_apps` — store listing of apps available for download in Vin Market
  - id (uuid, primary key)
  - name (text, not null) — display name of the app
  - description (text) — short description shown in the market
  - icon_name (text) — name of a lucide-react icon
  - app_type (text, not null) — 'direct' for direct download (raw file URL) or 'beta' for beta apps from the team
  - download_url (text) — for 'direct' type: URL to raw .tsx source file
  - code (text) — for 'beta' type: full source code stored inline
  - category (text) — e.g. 'Productivity', 'Games', 'Tools'
  - version (text) — version string
  - author (text) — who created the app
  - created_at (timestamptz)
  - updated_at (timestamptz)

2. Security
- Enable RLS on vin_market_apps.
- Allow anon + authenticated to SELECT (market is publicly readable, no sign-in needed).
- Only allow INSERT/UPDATE/DELETE via service role (admin manages from Supabase dashboard).
  The anon key cannot write — writes are done through the Supabase admin UI with the service role key.

3. Important Notes
- This is a single-tenant no-auth app: the frontend reads market listings as anon.
- Admin (the user managing the DB) adds/edits/removes app listings directly in the Supabase dashboard table editor.
- 'direct' apps have a download_url pointing to a raw .tsx file (e.g. on GitHub raw, gist, etc.).
- 'beta' apps have their full source code stored in the code column.
*/

CREATE TABLE IF NOT EXISTS vin_market_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon_name text DEFAULT 'Sparkles',
  app_type text NOT NULL DEFAULT 'direct',
  download_url text DEFAULT '',
  code text DEFAULT '',
  category text DEFAULT 'Tools',
  version text DEFAULT '1.0.0',
  author text DEFAULT 'Unknown',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vin_market_apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_market_apps" ON vin_market_apps;
CREATE POLICY "anon_select_market_apps" ON vin_market_apps FOR SELECT
TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies for anon — admin uses service role via Supabase dashboard
