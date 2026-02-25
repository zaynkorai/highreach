-- Optimize conversations for inbox view
ALTER TABLE conversations
ADD COLUMN last_message_preview TEXT,
ADD COLUMN unread_count INTEGER DEFAULT 0;

-- Ensure RLS allows Realtime to work
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE messages, conversations;
COMMIT;
