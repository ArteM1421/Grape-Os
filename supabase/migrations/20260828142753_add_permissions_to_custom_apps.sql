/*
# Add permissions column to custom_apps

1. Modified Tables
- `custom_apps` — add `permissions` column (jsonb, nullable) to store app permission arrays
  - Values like ["system:settings", "system:files"] indicate what system access an app needs
  - NULL means no special permissions (safe app)

2. Security
- No RLS changes — existing policies remain in place
*/

ALTER TABLE custom_apps
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT NULL;
