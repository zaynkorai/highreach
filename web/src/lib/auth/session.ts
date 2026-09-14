import { getCurrentSession, clearSessionCookie, type SessionPayload } from "./index";
import type { AppRole } from "@/lib/types/database";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface SessionUser {
    id: string;
    email: string;
    full_name?: string | null;
    tenant_id?: string;
    role?: AppRole;
    user_metadata?: Record<string, any>;
    app_metadata?: {
        tenant_id?: string;
        role?: AppRole;
    };
}

export interface SessionWithRole {
    user: SessionUser;
    tenantId: string;
    role: AppRole;
}

/**
 * Get current session with tenant_id and role.
 * Validates tokenVersion against the database to guarantee instantaneous
 * revocation upon password change, account deletion, or token bump.
 * Returns null if not authenticated or if token is revoked.
 */
export async function getSessionWithRole(): Promise<SessionWithRole | null> {
    const session = await getCurrentSession();
    if (!session) return null;

    try {
        const [dbUser] = await db
            .select({
                id: users.id,
                email: users.email,
                fullName: users.fullName,
                tenantId: users.tenantId,
                role: users.role,
                tokenVersion: users.tokenVersion,
            })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);

        // Revoke if user not found, token version bumped, or has no tenant assigned
        if (!dbUser || dbUser.tokenVersion !== (session.tokenVersion ?? 1) || !dbUser.tenantId) {
            await clearSessionCookie().catch(() => {});
            return null;
        }

        const activeTenantId = dbUser.tenantId;
        const activeRole = dbUser.role as AppRole;
        const activeFullName = dbUser.fullName || session.fullName;

        const user: SessionUser = {
            id: dbUser.id,
            email: dbUser.email,
            full_name: activeFullName,
            tenant_id: activeTenantId,
            role: activeRole,
            user_metadata: {
                full_name: activeFullName,
            },
            app_metadata: {
                tenant_id: activeTenantId,
                role: activeRole,
            },
        };

        return {
            user,
            tenantId: activeTenantId,
            role: activeRole,
        };
    } catch (error) {
        console.error("Error validating session with role:", error);
        return null;
    }
}

/**
 * Backward compatibility helper.
 */
export async function getSessionDetail() {
    const session = await getSessionWithRole();
    if (!session) {
        return { user: null, tenantId: null };
    }
    return {
        user: session.user,
        tenantId: session.tenantId,
    };
}
