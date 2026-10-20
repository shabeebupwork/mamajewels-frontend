ALTER TABLE publish_jobs
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'meta',
  ADD COLUMN IF NOT EXISTS platform_post_id text,
  ADD COLUMN IF NOT EXISTS slide_index integer;

CREATE INDEX IF NOT EXISTS idx_publish_jobs_platform_status_updated
  ON publish_jobs (platform, status, updated_at);
