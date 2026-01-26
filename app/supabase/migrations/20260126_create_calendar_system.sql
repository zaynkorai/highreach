-- ============ CALENDAR & BOOKING SYSTEM ============

-- 1. Calendars Table
CREATE TABLE IF NOT EXISTS calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL, -- For public booking URLs: /book/my-calendar
    description TEXT,
    location TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    buffer_minutes INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- 2. Availability Table (Recurring Schedule)
CREATE TABLE IF NOT EXISTS calendar_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (start_time < end_time)
);

-- 3. Appointments Table (Actual Bookings)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'no_show', 'completed')),
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Calendar Overrides (Specific dates: Vacations, holidays, etc)
CREATE TABLE IF NOT EXISTS calendar_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_unavailable BOOLEAN DEFAULT FALSE, -- If TRUE, user is blocked all day
    start_time TIME, -- If specific hours override
    end_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SECURITY (RLS) ============

ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_overrides ENABLE ROW LEVEL SECURITY;

-- Calendars
CREATE POLICY "Users can view their tenant's calendars" ON calendars 
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can insert calendars" ON calendars 
    FOR INSERT WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can update calendars" ON calendars 
    FOR UPDATE USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can delete calendars" ON calendars 
    FOR DELETE USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Availability
CREATE POLICY "Users can manage availability" ON calendar_availability 
    FOR ALL USING (calendar_id IN (SELECT id FROM calendars WHERE tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid));

-- Appointments
CREATE POLICY "Users can view appointments" ON appointments 
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "Users can manage appointments" ON appointments 
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Overrides
CREATE POLICY "Users can manage overrides" ON calendar_overrides 
    FOR ALL USING (calendar_id IN (SELECT id FROM calendars WHERE tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid));

-- ============ PUBLIC ACCESS (Phase 3) ============
-- Allow anonymous read to specific calendar data for the booking widget
CREATE POLICY "Anyone can view a calendar by slug" ON calendars
    FOR SELECT USING (is_active = true); -- We check slug in the query

CREATE POLICY "Anyone can view availability for booking" ON calendar_availability
    FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can check existing appointments for conflicts" ON appointments
    FOR SELECT USING (TRUE);

-- ============ PERFORMANCE ============
CREATE INDEX idx_calendars_tenant ON calendars(tenant_id);
CREATE INDEX idx_calendars_slug ON calendars(slug);
CREATE INDEX idx_availability_calendar ON calendar_availability(calendar_id);
CREATE INDEX idx_appointments_calendar_time ON appointments(calendar_id, start_time);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
