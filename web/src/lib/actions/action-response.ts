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
