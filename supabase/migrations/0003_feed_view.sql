-- Add last_feed_view_at to track unread badge state
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_feed_view_at timestamptz;
