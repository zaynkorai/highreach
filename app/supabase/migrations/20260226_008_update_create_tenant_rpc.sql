-- =============================================================
-- Phase 1, Migration 8: Update create_tenant_and_user RPC
--                        + Backfill existing users
-- =============================================================

-- 1. Update the RPC to also create a tenant_members row
CREATE OR REPLACE FUNCTION create_tenant_and_user(
  business_name TEXT,
  full_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  new_slug TEXT;
  current_user_id UUID;
  clean_slug TEXT;
  user_email TEXT;
BEGIN
  -- Get current user ID and email
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;

  -- Generate base slug
  clean_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9]', '-', 'g'));
  new_slug := clean_slug || '-' || to_hex(extract(epoch from now())::integer);

  -- 1. Create Tenant
  INSERT INTO tenants (name, slug)
  VALUES (business_name, new_slug)
  RETURNING id INTO new_tenant_id;

  -- 2. Create User Profile
  INSERT INTO users (id, tenant_id, email, full_name, role)
  VALUES (current_user_id, new_tenant_id, user_email, full_name, 'owner');

  -- 3. Create Tenant Membership (triggers JWT claims sync)
  INSERT INTO tenant_members (tenant_id, user_id, role, accepted_at)
  VALUES (new_tenant_id, current_user_id, 'owner', NOW());

  -- Return result
  RETURN jsonb_build_object(
    'tenant_id', new_tenant_id,
    'slug', new_slug
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;


-- 2. Backfill: Copy existing users into tenant_members
--    This is idempotent (ON CONFLICT DO NOTHING)
INSERT INTO tenant_members (tenant_id, user_id, role, accepted_at)
SELECT
  u.tenant_id,
  u.id,
  CASE 
    WHEN u.role = 'owner' THEN 'owner'::app_role
    WHEN u.role = 'admin' THEN 'admin'::app_role
    ELSE 'member'::app_role
  END,
  u.created_at
FROM users u
WHERE u.tenant_id IS NOT NULL
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 3. Backfill JWT claims for existing users
--    The trigger fires on INSERT, so the backfill above will have
--    already set claims. But just in case, force-sync all:
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT user_id, tenant_id, role FROM tenant_members LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object(
        'tenant_id', r.tenant_id::text,
        'role', r.role::text
      )
    WHERE id = r.user_id;
  END LOOP;
END;
$$;
