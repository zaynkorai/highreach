import { requirePermission, requireAuth } from "@/lib/rbac/guard";
import type { AppPermission } from "@/lib/types/database";
import type { SessionWithRole } from "@/lib/auth/session";

export type ActionResponse<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; details?: Record<string, unknown> };

export function successResponse<T>(data: T): ActionResponse<T> {
    return { success: true, data };
}

export function errorResponse(error: string, details?: Record<string, unknown>): ActionResponse<never> {
    return { success: false, error, details };
}

/**
 * Executes an arbitrary server action within a safe try-catch wrapper.
 */
export async function executeAction<T>(
    handler: () => Promise<T>
): Promise<ActionResponse<T>> {
    try {
        const data = await handler();
        return { success: true, data };
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error("[Action Error]:", err);
        return { success: false, error };
    }
}

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
