import { db, workflowSettings } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function getWorkflowSetting(tenantId: string, key: string) {
    const [data] = await db
        .select()
        .from(workflowSettings)
        .where(
            and(
                eq(workflowSettings.tenantId, tenantId),
                eq(workflowSettings.key, key)
            )
        )
        .limit(1);

    // Default to disabled if not found
    return data ? { enabled: data.enabled ?? false, config: (data.config as any) || {} } : { enabled: false, config: {} };
}
