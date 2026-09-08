import { getCurrentSession, type SessionPayload } from "./index";
import type { AppRole } from "@/lib/types/database";

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
 * Returns null if not authenticated.
 */
export async function getSessionWithRole(): Promise<SessionWithRole | null> {
    const session = await getCurrentSession();
    if (!session) return null;

    const user: SessionUser = {
        id: session.userId,
        email: session.email,
        full_name: session.fullName,
        tenant_id: session.tenantId,
        role: session.role,
        user_metadata: {
            full_name: session.fullName,
        },
        app_metadata: {
            tenant_id: session.tenantId,
            role: session.role,
        },
    };

    return {
        user,
        tenantId: session.tenantId,
        role: session.role,
    };
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
