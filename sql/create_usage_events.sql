-- Create usage_events table to track per-user usage of costly operations
CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('ai_chat','photo_analysis')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: enable and restrict to owners
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their usage" ON usage_events;
CREATE POLICY "Users can view their usage" ON usage_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their usage" ON usage_events;
CREATE POLICY "Users can insert their usage" ON usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional index for faster lookups
CREATE INDEX IF NOT EXISTS usage_events_user_kind_created_idx
  ON usage_events (user_id, kind, created_at DESC);

