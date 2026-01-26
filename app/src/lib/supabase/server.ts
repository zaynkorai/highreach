import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * DATABASE SCHEMA PRINCIPLES & SECURITY (From principal.md / test.md)
 * 
 * Every table MUST have:
 * - id (uuid, primary key)
 * - tenant_id (uuid, foreign key, indexed)
 * - created_at, updated_at (timestamps)
 * 
 * RLS policy on ALL tables MUST be:
 * USING (tenant_id = auth.jwt() ->> 'tenant_id')
 * 
 * Security Testing Requirements:
 * 1. Cross-Tenant Data Leakage: RLS must prevent User A from accessing User B's resources.
 *    Any direct access attempt must return 404/401.
 * 2. RLS Group Validation: Bulk queries must only return records scoped to the auth'd Tenant A.
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
