import { createBrowserClient } from "@supabase/ssr";

/**
 * DATABASE SCHEMA PRINCIPLES & SECURITY 
 * 
 * Every table MUST have:
 * - id (uuid, primary key)
 * - tenant_id (uuid, foreign key, indexed)
 * - created_at, updated_at (timestamps)
 * 
 * RLS policy on ALL tables MUST be:
 * USING (tenant_id = auth.jwt() ->> 'tenant_id')
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
