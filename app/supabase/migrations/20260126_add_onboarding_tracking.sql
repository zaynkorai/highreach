-- Migration: Add Onboarding tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_in_company TEXT;
