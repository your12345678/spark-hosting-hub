/*
  # Patch site_settings table

  Adds missing `id` primary key and `label` columns, seeds default link settings.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'id'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN id uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'label'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN label text NOT NULL DEFAULT '';
  END IF;
END $$;

INSERT INTO site_settings (key, label, value) VALUES
  ('status_url', 'Status page URL', ''),
  ('discord_url', 'Discord invite URL', ''),
  ('terms_url', 'Terms of Service URL', ''),
  ('privacy_url', 'Privacy Policy URL', '')
ON CONFLICT (key) DO NOTHING;

UPDATE site_settings SET label = 'Status page URL' WHERE key = 'status_url' AND label = '';
UPDATE site_settings SET label = 'Discord invite URL' WHERE key = 'discord_url' AND label = '';
UPDATE site_settings SET label = 'Terms of Service URL' WHERE key = 'terms_url' AND label = '';
UPDATE site_settings SET label = 'Privacy Policy URL' WHERE key = 'privacy_url' AND label = '';
