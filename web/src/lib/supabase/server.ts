import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * MULTI-TENANCY & RBAC
 * 
 * RLS policies use JWT claims (auth.jwt() -> 'app_metadata'):
 * - tenant_id: isolates all data per tenant  
 * - role: gates write/delete via authorize() function
 * 
 * Claims are set by the sync_tenant_claims() trigger on tenant_members.
 * See: app/supabase/migrations/20260226_005_jwt_claims_trigger.sql
 * 
 * Security Testing Requirements:
 * 1. Cross-Tenant Data Leakage: RLS must prevent User A from accessing User B's resources.
 * 2. Permission Escalation: Members must not be able to perform owner/admin actions.
 */

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}
