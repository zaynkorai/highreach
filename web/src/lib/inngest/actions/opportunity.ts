import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function handleUpdateOpportunity(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const opportunityId = triggerData.opportunity?.id || triggerData.id;
    if (!opportunityId) return;

    const updates: Partial<{ status: string; pipelineStageId: string }> = {};
    if (config.status) updates.status = config.status;
    if (config.pipeline_stage_id) updates.pipelineStageId = config.pipeline_stage_id;

    if (Object.keys(updates).length > 0) {
        await db
            .update(opportunities)
            .set(updates)
            .where(and(eq(opportunities.id, opportunityId), eq(opportunities.tenantId, tenantId)));
    }
}
