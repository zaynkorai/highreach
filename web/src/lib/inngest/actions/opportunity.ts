import { db } from "@/lib/db";
import { opportunities, pipelineStages, contactActivities } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { formatTemplate } from "../utils/helpers";

export async function handleUpdateOpportunity(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const opportunityId = triggerData.opportunity?.id || triggerData.opportunity_id || triggerData.id;
    if (!opportunityId) return;

    const updates: Partial<{ status: string; pipelineStageId: string; title: string; value: string }> = {};
    if (config.status) updates.status = config.status;
    if (config.pipeline_stage_id) updates.pipelineStageId = config.pipeline_stage_id;
    if (config.title) updates.title = formatTemplate(config.title, triggerData);
    if (config.value) updates.value = String(config.value);

    if (Object.keys(updates).length > 0) {
        await db
            .update(opportunities)
            .set(updates)
            .where(and(eq(opportunities.id, opportunityId), eq(opportunities.tenantId, tenantId)));
    }
}

export async function handleMovePipelineStage(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const opportunityId = triggerData.opportunity?.id || triggerData.opportunity_id || triggerData.id;
    const stageId = config.pipeline_stage_id || config.stage_id;
    if (!opportunityId || !stageId) return;

    await db
        .update(opportunities)
        .set({ pipelineStageId: stageId })
        .where(and(eq(opportunities.id, opportunityId), eq(opportunities.tenantId, tenantId)));
}

export async function handleCreateOpportunity(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const contactId = triggerData.contact?.id || triggerData.contact_id || triggerData.id;
    if (!contactId) return;

    let stageId = config.pipeline_stage_id || config.stage_id;

    if (!stageId) {
        // Fallback to first available stage in tenant
        const [firstStage] = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(eq(pipelineStages.tenantId, tenantId))
            .limit(1);
        if (firstStage) stageId = firstStage.id;
    }

    if (!stageId) return;

    const [maxOrder] = await db
        .select({ orderIndex: opportunities.orderIndex })
        .from(opportunities)
        .where(and(eq(opportunities.pipelineStageId, stageId), eq(opportunities.tenantId, tenantId)))
        .orderBy(desc(opportunities.orderIndex))
        .limit(1);

    const title = formatTemplate(config.title || "New Opportunity - {{contact.name}}", triggerData);
    const value = config.value ? String(config.value) : "0";

    const [newOpp] = await db
        .insert(opportunities)
        .values({
            tenantId,
            contactId,
            pipelineStageId: stageId,
            title,
            value,
            status: config.status || "open",
            orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
        })
        .returning();

    if (newOpp) {
        await db.insert(contactActivities).values({
            contactId,
            tenantId,
            type: "opportunity_created",
            content: `Created deal "${title}" valued at $${value}`,
            metadata: { opportunity_id: newOpp.id }
        });
    }
}
