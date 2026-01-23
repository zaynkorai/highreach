-- Secure function to create tenant and user profile in one transaction
CREATE OR REPLACE FUNCTION create_tenant_and_user(
  business_name TEXT,
  full_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner to bypass RLS during creation
SET search_path = public -- Secure search path
AS $$
DECLARE
  new_tenant_id UUID;
  new_slug TEXT;
  current_user_id UUID;
  clean_slug TEXT;
  user_email TEXT;
BEGIN
  -- Get current user ID and Email
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;

  -- Generate base slug
  clean_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9]', '-', 'g'));
  -- Add timestamp to ensure uniqueness
  new_slug := clean_slug || '-' || to_hex(extract(epoch from now())::integer);

  -- 1. Create Tenant
  INSERT INTO tenants (name, slug)
  VALUES (business_name, new_slug)
  RETURNING id INTO new_tenant_id;

  -- 2. Create User Profile linked to Tenant
  INSERT INTO users (id, tenant_id, email, full_name, role)
  VALUES (current_user_id, new_tenant_id, user_email, full_name, 'owner');

  -- Return result
  RETURN jsonb_build_object(
    'tenant_id', new_tenant_id,
    'slug', new_slug
  );

EXCEPTION WHEN OTHERS THEN
  -- Transaction automatically rolls back on exception
  RAISE;
END;
$$;
