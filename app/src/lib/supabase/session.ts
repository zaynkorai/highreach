import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/database";

/**
 * Session detail with RBAC context.
 * 
 * Reads tenant_id and role from JWT app_metadata (set by the
 * sync_tenant_claims trigger on tenant_members). This means
 * ZERO database queries — the claims are baked into the token.
 */

export interface SessionWithRole {
    user: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['getUser']>>['data']['user']>;
    tenantId: string;
    role: AppRole;
    supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Get the current session with tenant_id and role from JWT claims.
 * Returns null if not authenticated or if claims are missing.
 */
export async function getSessionWithRole(): Promise<SessionWithRole | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const tenantId = user.app_metadata?.tenant_id as string | undefined;
    const role = user.app_metadata?.role as AppRole | undefined;

    // If claims are missing, the user hasn't completed signup or needs a token refresh
    if (!tenantId || !role) return null;

    return { user, tenantId, role, supabase };
}

/**
 * @deprecated Use getSessionWithRole() instead. Kept for backward compatibility
 * during migration. Will be removed after Phase 2 is complete.
 */
export async function getSessionDetail() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { user: null, tenantId: null, supabase };

    // Try JWT claims first, fall back to DB query
    const tenantId = user.app_metadata?.tenant_id as string | undefined;
    if (tenantId) {
        return { user, tenantId, supabase };
    }

    // Legacy fallback: DB query
    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    return {
        user,
        tenantId: userData?.tenant_id || null,
        supabase
    };
}
