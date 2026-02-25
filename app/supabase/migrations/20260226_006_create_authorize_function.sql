-- =============================================================
-- Phase 1, Migration 6: authorize() Helper Function
-- =============================================================
-- Used inside RLS policies to check if the current user's role
-- has a specific permission, without any sub-selects on users table.
-- =============================================================

CREATE OR REPLACE FUNCTION authorize(requested_permission app_permission)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Read role directly from JWT claims (set by sync_tenant_claims trigger)
  user_role := (auth.jwt() -> 'app_metadata' ->> 'role')::app_role;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role = user_role
      AND permission = requested_permission
  );
END;
$$;
