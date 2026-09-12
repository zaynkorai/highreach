-- ============ EXTERNAL CALENDAR EVENTS CACHE ============

CREATE TABLE IF NOT EXISTS external_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_account_id UUID NOT NULL REFERENCES external_accounts(id) ON DELETE CASCADE,
    external_calendar_id TEXT NOT NULL,
    external_event_id TEXT NOT NULL,
    title TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(external_account_id, external_calendar_id, external_event_id)
);

ALTER TABLE external_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant's external calendar events" ON external_calendar_events
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_ext_events_time ON external_calendar_events(external_account_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_ext_events_tenant ON external_calendar_events(tenant_id);
