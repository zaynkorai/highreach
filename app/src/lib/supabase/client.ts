import { createBrowserClient } from "@supabase/ssr";

/**
 * MULTI-TENANCY & RBAC
 * 
 * RLS policies use JWT claims (auth.jwt() -> 'app_metadata'):
 * - tenant_id: isolates all data per tenant
 * - role: gates write/delete via authorize() function
 * 
 * Claims are set by the sync_tenant_claims() trigger on tenant_members.
 * See: app/supabase/migrations/20260226_005_jwt_claims_trigger.sql
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
