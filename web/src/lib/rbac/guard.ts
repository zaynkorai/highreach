import type { AppPermission } from "@/lib/types/database";
import { getSessionWithRole, type SessionWithRole } from "@/lib/supabase/session";
import { hasPermission, hasAllPermissions } from "@/lib/rbac/permissions";

/**
 * Server-side permission guard for Server Actions and API routes.
 *
 * Usage in Server Actions:
 *   const session = await requirePermission('contacts.write');
 *   // session.tenantId, session.role, session.user are guaranteed
 *
 * Throws with appropriate HTTP-style errors:
 *   - "Unauthorized" (401) if not authenticated
 *   - "Forbidden" (403) if permission denied
 */
export async function requirePermission(
    permission: AppPermission
): Promise<SessionWithRole> {
    const session = await getSessionWithRole();

    if (!session) {
        throw new Error("Unauthorized");
    }

    if (!hasPermission(session.role, permission)) {
        throw new Error("Forbidden");
    }

    return session;
}

/**
 * Require ALL of the specified permissions.
 */
export async function requireAllPermissions(
    permissions: AppPermission[]
): Promise<SessionWithRole> {
    const session = await getSessionWithRole();

    if (!session) {
        throw new Error("Unauthorized");
    }

    if (!hasAllPermissions(session.role, permissions)) {
        throw new Error("Forbidden");
    }

    return session;
}

/**
 * Require authentication only (no specific permission check).
 * Returns session with role information.
 */
export async function requireAuth(): Promise<SessionWithRole> {
    const session = await getSessionWithRole();

    if (!session) {
        throw new Error("Unauthorized");
    }

    return session;
}
