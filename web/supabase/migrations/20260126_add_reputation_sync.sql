-- ============ REPUTATION SYNC (Google & Facebook) ============

-- 1. Extend external_accounts for Business Locations
ALTER TABLE external_accounts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
-- This metadata will store { location_id: '...', location_name: '...', account_id: '...' }

-- 2. Performance
CREATE INDEX IF NOT EXISTS idx_external_accounts_provider ON external_accounts(provider);

-- 3. Reviews Table Constraints
ALTER TABLE reviews ADD CONSTRAINT unique_tenant_review UNIQUE (tenant_id, external_id);
