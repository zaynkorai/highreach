-- Migration: Unified Inbox 2.0 Enhancements
-- 1. Support Internal Notes in Messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- 2. Support Conversation Assignment
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- 3. Update Channel Constraint (if it exists)
-- If there's a check constraint on channel, we might need to update it. 
-- Assuming it's a simple text column or has no strict constraint for now.
