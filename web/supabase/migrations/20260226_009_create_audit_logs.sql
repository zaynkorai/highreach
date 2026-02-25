-- =============================================================
-- Phase 3, Migration 9: Audit Logs
-- =============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,  -- 'contact.created', 'team.member_invited', etc.
  resource_type TEXT,    -- 'contact', 'form', 'team_member', etc.
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can read audit logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND authorize('settings.read')
  );

-- Direct inserts are forbidden — use the log_audit_event RPC instead
CREATE POLICY "audit_logs_no_direct_insert" ON audit_logs
  FOR INSERT WITH CHECK (false);

-- RPC for audit event logging (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;
