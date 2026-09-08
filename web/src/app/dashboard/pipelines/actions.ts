"use server";

import { getSessionWithRole } from "@/lib/auth/session";
import { db, pipelines, pipelineStages, opportunities, contacts } from "@/lib/db";
import { eq, asc, desc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { opportunitySchema, OpportunityFormData } from "@/lib/validations/opportunity";
import { inngest } from "@/lib/inngest/client";

export async function getPipelines() {
    try {
        const session = await getSessionWithRole();
        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const tenantPipelines = await db
            .select()
            .from(pipelines)
            .where(eq(pipelines.tenantId, session.tenantId))
            .orderBy(asc(pipelines.createdAt));

        if (tenantPipelines.length === 0) {
            return await seedDefaultPipeline(session.tenantId, session.user.id);
        }

        const pipelineIds = tenantPipelines.map((p) => p.id);
        const allStages = await db
            .select()
            .from(pipelineStages)
            .where(inArray(pipelineStages.pipelineId, pipelineIds))
            .orderBy(asc(pipelineStages.orderIndex));

        const result = tenantPipelines.map((p) => ({
            id: p.id,
            tenant_id: p.tenantId,
            name: p.name,
            created_at: p.createdAt.toISOString(),
            created_by: p.createdBy,
            stages: allStages
                .filter((s) => s.pipelineId === p.id)
                .map((s) => ({
                    id: s.id,
                    pipeline_id: s.pipelineId,
                    tenant_id: s.tenantId,
                    name: s.name,
                    order_index: s.orderIndex,
                    created_at: s.createdAt.toISOString(),
                })),
        }));

        return { success: true, data: result };
    } catch (e: any) {
        console.error("getPipelines Error:", e);
        return { success: false, error: "Failed to fetch pipelines" };
    }
}

async function seedDefaultPipeline(tenantId: string, userId: string) {
    try {
        const [pipeline] = await db
            .insert(pipelines)
            .values({
                tenantId,
                name: "Sales Pipeline",
                createdBy: userId,
            })
            .returning();

        const defaultStages = [
            { name: "Leads", orderIndex: 0 },
            { name: "Interested", orderIndex: 1 },
            { name: "Demo Scheduled", orderIndex: 2 },
            { name: "Negotiation", orderIndex: 3 },
            { name: "Closed Won", orderIndex: 4 },
            { name: "Closed Lost", orderIndex: 5 },
        ].map((s) => ({
            pipelineId: pipeline.id,
            tenantId,
            name: s.name,
            orderIndex: s.orderIndex,
        }));

        const insertedStages = await db.insert(pipelineStages).values(defaultStages).returning();

        const result = [
            {
                id: pipeline.id,
                tenant_id: pipeline.tenantId,
                name: pipeline.name,
                created_at: pipeline.createdAt.toISOString(),
                created_by: pipeline.createdBy,
                stages: insertedStages.map((s) => ({
                    id: s.id,
                    pipeline_id: s.pipelineId,
                    tenant_id: s.tenantId,
                    name: s.name,
                    order_index: s.orderIndex,
                    created_at: s.createdAt.toISOString(),
                })),
            },
        ];

        return { success: true, data: result };
    } catch (e: any) {
        console.error("Seed Pipeline Error:", e);
        return { success: false, error: "Failed to seed default pipeline" };
    }
}

export async function getOpportunities(pipelineId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        if (!pipelineId) return { success: true, data: [] };

        const stages = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(eq(pipelineStages.pipelineId, pipelineId));

        const stageIds = stages.map((s) => s.id);
        if (stageIds.length === 0) return { success: true, data: [] };

        const opps = await db
            .select({
                opportunity: opportunities,
                contact: contacts,
            })
            .from(opportunities)
            .innerJoin(contacts, eq(opportunities.contactId, contacts.id))
            .where(
                and(
                    eq(opportunities.tenantId, session.tenantId),
                    eq(opportunities.status, "open"),
                    inArray(opportunities.pipelineStageId, stageIds)
                )
            )
            .orderBy(asc(opportunities.orderIndex));

        const formatted = opps.map(({ opportunity: o, contact: c }) => ({
            id: o.id,
            tenant_id: o.tenantId,
            contact_id: o.contactId,
            pipeline_stage_id: o.pipelineStageId,
            title: o.title,
            value: o.value ? parseFloat(o.value) : 0,
            status: o.status,
            order_index: o.orderIndex,
            created_at: o.createdAt.toISOString(),
            created_by: o.createdBy,
            contact: {
                id: c.id,
                tenant_id: c.tenantId,
                first_name: c.firstName,
                last_name: c.lastName,
                email: c.email,
                phone: c.phone,
                tags: c.tags || [],
                source: c.source,
                notes: c.notes,
                created_at: c.createdAt.toISOString(),
                updated_at: c.updatedAt.toISOString(),
            },
        }));

        return { success: true, data: formatted };
    } catch (e: any) {
        console.error("getOpportunities Error:", e);
        return { success: false, error: "Failed to fetch opportunities" };
    }
}

export async function createOpportunity(formData: OpportunityFormData) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const validated = opportunitySchema.parse(formData);

        // Verify contact belongs to this tenant
        const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.id, validated.contactId), eq(contacts.tenantId, session.tenantId)))
            .limit(1);
        if (!contact) return { success: false, error: "Contact not found or access denied" };

        // Verify pipeline stage belongs to this tenant
        const [stage] = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(and(eq(pipelineStages.id, validated.pipelineStageId), eq(pipelineStages.tenantId, session.tenantId)))
            .limit(1);
        if (!stage) return { success: false, error: "Pipeline stage not found or access denied" };

        // Get max order_index for this stage
        const existing = await db
            .select({ orderIndex: opportunities.orderIndex })
            .from(opportunities)
            .where(eq(opportunities.pipelineStageId, validated.pipelineStageId))
            .orderBy(desc(opportunities.orderIndex))
            .limit(1);

        const nextOrder = (existing[0]?.orderIndex ?? -1) + 1;

        const [created] = await db
            .insert(opportunities)
            .values({
                tenantId: session.tenantId,
                contactId: validated.contactId,
                pipelineStageId: validated.pipelineStageId,
                title: validated.title,
                value: validated.value ? String(validated.value) : "0",
                status: validated.status || "open",
                orderIndex: nextOrder,
                createdBy: session.user.id,
            })
            .returning();

        revalidatePath("/dashboard/pipelines");
        return { success: true, data: created };
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to create opportunity" };
    }
}

export async function moveOpportunity(
    opportunityId: string,
    newStageId: string,
    newOrderIndex: number
) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        // Verify target stage belongs to this tenant
        const [stage] = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(and(eq(pipelineStages.id, newStageId), eq(pipelineStages.tenantId, session.tenantId)))
            .limit(1);
        if (!stage) return { success: false, error: "Target pipeline stage not found or access denied" };

        await db
            .update(opportunities)
            .set({
                pipelineStageId: newStageId,
                orderIndex: newOrderIndex,
            })
            .where(
                and(
                    eq(opportunities.id, opportunityId),
                    eq(opportunities.tenantId, session.tenantId)
                )
            );

        revalidatePath("/dashboard/pipelines");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to move opportunity" };
    }
}

export async function updateOpportunityStatus(id: string, status: "won" | "lost") {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const [opp] = await db
            .select()
            .from(opportunities)
            .where(and(eq(opportunities.id, id), eq(opportunities.tenantId, session.tenantId)))
            .limit(1);

        if (!opp) return { success: false, error: "Opportunity not found" };

        await db
            .update(opportunities)
            .set({ status })
            .where(eq(opportunities.id, id));

        try {
            await inngest.send({
                name: "opportunity.stage_changed",
                data: {
                    opportunity_id: id,
                    tenant_id: opp.tenantId,
                    stage_id: opp.pipelineStageId,
                    status,
                },
            });
        } catch (err) {
            console.warn("Inngest send error:", err);
        }

        revalidatePath("/dashboard/pipelines");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to update status" };
    }
}
