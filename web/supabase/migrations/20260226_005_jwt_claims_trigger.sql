-- =============================================================
-- Phase 1, Migration 5: JWT Claims Sync Trigger
-- =============================================================
-- Syncs tenant_id + role from tenant_members into
-- auth.users.raw_app_meta_data on every INSERT/UPDATE.
-- This means RLS can read claims from auth.jwt() with zero sub-selects.
-- =============================================================

CREATE OR REPLACE FUNCTION sync_tenant_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'tenant_id', NEW.tenant_id::text,
      'role', NEW.role::text
    )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Fire on INSERT (join team) and UPDATE (role change)
CREATE TRIGGER on_tenant_member_change
  AFTER INSERT OR UPDATE ON tenant_members
  FOR EACH ROW EXECUTE FUNCTION sync_tenant_claims();

-- Also clear claims when a member is removed
CREATE OR REPLACE FUNCTION clear_tenant_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only clear if this was their last membership
  IF NOT EXISTS (
    SELECT 1 FROM tenant_members WHERE user_id = OLD.user_id AND id != OLD.id
  ) THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      raw_app_meta_data - 'tenant_id' - 'role'
    WHERE id = OLD.user_id;
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER on_tenant_member_remove
  AFTER DELETE ON tenant_members
  FOR EACH ROW EXECUTE FUNCTION clear_tenant_claims();
