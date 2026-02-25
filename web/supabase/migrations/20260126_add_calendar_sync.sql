-- ============ CALENDAR SYNC (Google & Outlook) ============

-- 1. External Accounts Table
CREATE TABLE IF NOT EXISTS external_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
    provider_account_id TEXT NOT NULL, -- Email address usually
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, provider, provider_account_id)
);

-- 2. Link Calendars to External Sync
ALTER TABLE calendars ADD COLUMN IF NOT EXISTS external_account_id UUID REFERENCES external_accounts(id) ON DELETE SET NULL;
ALTER TABLE calendars ADD COLUMN IF NOT EXISTS external_calendar_id TEXT; -- e.g. 'primary' for Google
ALTER TABLE calendars ADD COLUMN IF NOT EXISTS sync_direction TEXT DEFAULT 'off' CHECK (sync_direction IN ('off', 'one_way', 'bi_directional'));
ALTER TABLE calendars ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- 3. Link Appointments to External Events
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS external_event_id TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS external_provider TEXT;

-- 4. Security (RLS)
ALTER TABLE external_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant's external accounts" ON external_accounts
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- 5. Performance
CREATE INDEX idx_external_accounts_tenant ON external_accounts(tenant_id);
CREATE INDEX idx_appointments_external_id ON appointments(external_event_id);
