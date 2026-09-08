import { requirePermission, requireAuth } from "@/lib/rbac/guard";
import type { AppPermission } from "@/lib/types/database";
import type { SessionWithRole } from "@/lib/auth/session";

export * from "./action-response";
import type { ActionResponse } from "./action-response";

/**
 * Enforces specific RBAC permission before executing the server action handler.
 */
export async function withPermission<T>(
    permission: AppPermission,
    handler: (session: SessionWithRole) => Promise<T>
): Promise<ActionResponse<T>> {
    try {
        const session = await requirePermission(permission);
        const data = await handler(session);
        return { success: true, data };
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error(`[Action Guard (${permission})]:`, err);
        return { success: false, error };
    }
}

/**
 * Enforces authenticated session before executing the server action handler.
 */
export async function withAuth<T>(
    handler: (session: SessionWithRole) => Promise<T>
): Promise<ActionResponse<T>> {
    try {
        const session = await requireAuth();
        const data = await handler(session);
        return { success: true, data };
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error("[Action Auth Guard]:", err);
        return { success: false, error };
    }
}
