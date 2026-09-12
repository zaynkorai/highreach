-- Migration: Add description, status, and views to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived'));
ALTER TABLE forms ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0 NOT NULL;
