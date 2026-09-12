import { db, pipelines, pipelineStages, opportunities, contacts } from "@/lib/db";
import { eq, asc, desc, and, inArray, ne, sql } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import {
    opportunitySchema,
    updateOpportunitySchema,
    OpportunityFormData,
    UpdateOpportunityFormData,
    stageSchema,
    pipelineSchema,
} from "@/lib/validations/opportunity";
import type { Opportunity, OpportunityStatus, PipelineStage, PipelineWithStages } from "@/types/pipeline";

export class PipelineService {
    static async getPipelines(tenantId: string, userId: string) {
        const tenantPipelines = await db
            .select()
            .from(pipelines)
            .where(eq(pipelines.tenantId, tenantId))
            .orderBy(asc(pipelines.createdAt));

        if (tenantPipelines.length === 0) {
            return await this.seedDefaultPipeline(tenantId, userId);
        }

        const pipelineIds = tenantPipelines.map((p) => p.id);
        const allStages = await db
            .select()
            .from(pipelineStages)
            .where(inArray(pipelineStages.pipelineId, pipelineIds))
            .orderBy(asc(pipelineStages.orderIndex));

        return tenantPipelines.map((p) => ({
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
    }

    static async seedDefaultPipeline(tenantId: string, userId: string) {
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

        return [
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
    }

    static async getOpportunities(tenantId: string, pipelineId?: string) {
        if (pipelineId) {
            const rows = await db
                .select({
                    opportunity: opportunities,
                    contact: contacts,
                })
                .from(opportunities)
                .innerJoin(contacts, eq(opportunities.contactId, contacts.id))
                .innerJoin(pipelineStages, eq(opportunities.pipelineStageId, pipelineStages.id))
                .where(
                    and(
                        eq(opportunities.tenantId, tenantId),
                        eq(pipelineStages.pipelineId, pipelineId)
                    )
                )
                .orderBy(asc(opportunities.orderIndex));

            return rows.map(({ opportunity: o, contact: c }) => ({
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
        }

        const rows = await db
            .select({
                opportunity: opportunities,
                contact: contacts,
            })
            .from(opportunities)
            .innerJoin(contacts, eq(opportunities.contactId, contacts.id))
            .where(eq(opportunities.tenantId, tenantId))
            .orderBy(asc(opportunities.orderIndex));

        return rows.map(({ opportunity: o, contact: c }) => ({
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
    }

    static async createOpportunity(tenantId: string, userId: string, formData: OpportunityFormData): Promise<Opportunity> {
        const validated = opportunitySchema.parse(formData);

        // Verify contact belongs to tenant
        const [contact] = await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, validated.contactId), eq(contacts.tenantId, tenantId)))
            .limit(1);
        if (!contact) throw new Error("Contact not found or access denied");

        // Verify stage belongs to tenant
        const [stage] = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(and(eq(pipelineStages.id, validated.pipelineStageId), eq(pipelineStages.tenantId, tenantId)))
            .limit(1);
        if (!stage) throw new Error("Pipeline stage not found or access denied");

        const existing = await db
            .select({ orderIndex: opportunities.orderIndex })
            .from(opportunities)
            .where(and(eq(opportunities.pipelineStageId, validated.pipelineStageId), eq(opportunities.tenantId, tenantId)))
            .orderBy(desc(opportunities.orderIndex))
            .limit(1);

        const nextOrder = (existing[0]?.orderIndex ?? -1) + 1;

        const [created] = await db
            .insert(opportunities)
            .values({
                tenantId,
                contactId: validated.contactId,
                pipelineStageId: validated.pipelineStageId,
                title: validated.title,
                value: validated.value ? String(validated.value) : "0",
                status: validated.status || "open",
                orderIndex: nextOrder,
                createdBy: userId,
            })
            .returning();

        try {
            await inngest.send({
                name: "opportunity.created",
                data: {
                    opportunity_id: created.id,
                    tenant_id: tenantId,
                    contact_id: created.contactId,
                    stage_id: created.pipelineStageId,
                    title: created.title,
                    value: created.value ? parseFloat(created.value) : 0,
                    status: created.status,
                },
            });
        } catch (err) {
            console.warn("Inngest send error in createOpportunity:", err);
        }

        return {
            id: created.id,
            tenant_id: created.tenantId,
            contact_id: created.contactId,
            pipeline_stage_id: created.pipelineStageId,
            title: created.title,
            value: created.value ? parseFloat(created.value) : 0,
            status: created.status as OpportunityStatus,
            order_index: created.orderIndex,
            created_at: created.createdAt.toISOString(),
            created_by: created.createdBy || userId,
            contact: {
                id: contact.id,
                tenant_id: contact.tenantId,
                first_name: contact.firstName,
                last_name: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                tags: contact.tags || [],
                source: contact.source,
                notes: contact.notes,
                created_at: contact.createdAt.toISOString(),
                updated_at: contact.updatedAt.toISOString(),
            },
        };
    }

    static async updateOpportunity(
        tenantId: string,
        id: string,
        formData: UpdateOpportunityFormData
    ): Promise<Opportunity> {
        const validated = updateOpportunitySchema.parse(formData);

        if (validated.contactId) {
            const [contact] = await db
                .select({ id: contacts.id })
                .from(contacts)
                .where(and(eq(contacts.id, validated.contactId), eq(contacts.tenantId, tenantId)))
                .limit(1);
            if (!contact) throw new Error("Contact not found or access denied");
        }

        if (validated.pipelineStageId) {
            const [stage] = await db
                .select({ id: pipelineStages.id })
                .from(pipelineStages)
                .where(and(eq(pipelineStages.id, validated.pipelineStageId), eq(pipelineStages.tenantId, tenantId)))
                .limit(1);
            if (!stage) throw new Error("Pipeline stage not found or access denied");
        }

        const [existing] = await db
            .select({ stageId: opportunities.pipelineStageId, status: opportunities.status })
            .from(opportunities)
            .where(and(eq(opportunities.id, id), eq(opportunities.tenantId, tenantId)))
            .limit(1);

        const updatePayload: Record<string, any> = {};
        if (validated.title !== undefined) updatePayload.title = validated.title;
        if (validated.value !== undefined) updatePayload.value = String(validated.value);
        if (validated.contactId !== undefined) updatePayload.contactId = validated.contactId;
        if (validated.pipelineStageId !== undefined) updatePayload.pipelineStageId = validated.pipelineStageId;
        if (validated.status !== undefined) updatePayload.status = validated.status;

        const [updated] = await db
            .update(opportunities)
            .set(updatePayload)
            .where(and(eq(opportunities.id, id), eq(opportunities.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Opportunity not found or access denied");
        }

        if (existing && updated) {
            if (validated.pipelineStageId && validated.pipelineStageId !== existing.stageId) {
                try {
                    await inngest.send({
                        name: "opportunity.stage_changed",
                        data: {
                            opportunity_id: updated.id,
                            tenant_id: tenantId,
                            stage_id: updated.pipelineStageId,
                            previous_stage_id: existing.stageId,
                            status: updated.status,
                            contact_id: updated.contactId,
                        },
                    });
                } catch (err) {
                    console.warn("Inngest send error in stage_changed:", err);
                }
            }

            if (validated.status && validated.status !== existing.status) {
                try {
                    await inngest.send({
                        name: "opportunity.status_changed",
                        data: {
                            opportunity_id: updated.id,
                            tenant_id: tenantId,
                            status: updated.status,
                            previous_status: existing.status,
                            contact_id: updated.contactId,
                        },
                    });
                } catch (err) {
                    console.warn("Inngest send error in status_changed:", err);
                }
            }
        }

        const [contact] = await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, updated.contactId), eq(contacts.tenantId, tenantId)))
            .limit(1);

        return {
            id: updated.id,
            tenant_id: updated.tenantId,
            contact_id: updated.contactId,
            pipeline_stage_id: updated.pipelineStageId,
            title: updated.title,
            value: updated.value ? parseFloat(updated.value) : 0,
            status: updated.status as OpportunityStatus,
            order_index: updated.orderIndex,
            created_at: updated.createdAt.toISOString(),
            created_by: updated.createdBy || "",
            contact: contact ? {
                id: contact.id,
                tenant_id: contact.tenantId,
                first_name: contact.firstName,
                last_name: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                tags: contact.tags || [],
                source: contact.source,
                notes: contact.notes,
                created_at: contact.createdAt.toISOString(),
                updated_at: contact.updatedAt.toISOString(),
            } : undefined,
        };
    }

    static async moveOpportunity(
        tenantId: string,
        opportunityId: string,
        newStageId: string,
        newOrderIndex: number
    ) {
        // Verify current opportunity belongs to tenant
        const [current] = await db
            .select()
            .from(opportunities)
            .where(and(eq(opportunities.id, opportunityId), eq(opportunities.tenantId, tenantId)))
            .limit(1);
        if (!current) throw new Error("Opportunity not found or access denied");

        // Verify target stage belongs to tenant
        const [stage] = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(and(eq(pipelineStages.id, newStageId), eq(pipelineStages.tenantId, tenantId)))
            .limit(1);
        if (!stage) throw new Error("Target pipeline stage not found or access denied");

        const oldStageId = current.pipelineStageId;

        // Fetch existing opportunities in destination stage (excluding moving one)
        const destOpps = await db
            .select({ id: opportunities.id })
            .from(opportunities)
            .where(
                and(
                    eq(opportunities.tenantId, tenantId),
                    eq(opportunities.pipelineStageId, newStageId),
                    ne(opportunities.id, opportunityId)
                )
            )
            .orderBy(asc(opportunities.orderIndex), asc(opportunities.createdAt));

        // Insert at clamped newOrderIndex
        const clampedIndex = Math.max(0, Math.min(newOrderIndex, destOpps.length));
        const newDestList = [
            ...destOpps.slice(0, clampedIndex),
            { id: opportunityId },
            ...destOpps.slice(clampedIndex),
        ];

        // Update all items in destination stage
        for (let i = 0; i < newDestList.length; i++) {
            const isTarget = newDestList[i].id === opportunityId;
            await db
                .update(opportunities)
                .set({
                    orderIndex: i,
                    ...(isTarget ? { pipelineStageId: newStageId } : {}),
                })
                .where(and(eq(opportunities.id, newDestList[i].id), eq(opportunities.tenantId, tenantId)));
        }

        // If moved between different stages, re-index source stage
        if (oldStageId !== newStageId) {
            const srcOpps = await db
                .select({ id: opportunities.id })
                .from(opportunities)
                .where(
                    and(
                        eq(opportunities.tenantId, tenantId),
                        eq(opportunities.pipelineStageId, oldStageId),
                        ne(opportunities.id, opportunityId)
                    )
                )
                .orderBy(asc(opportunities.orderIndex), asc(opportunities.createdAt));

            for (let i = 0; i < srcOpps.length; i++) {
                await db
                    .update(opportunities)
                    .set({ orderIndex: i })
                    .where(and(eq(opportunities.id, srcOpps[i].id), eq(opportunities.tenantId, tenantId)));
            }

            try {
                await inngest.send({
                    name: "opportunity.stage_changed",
                    data: {
                        opportunity_id: opportunityId,
                        tenant_id: tenantId,
                        stage_id: newStageId,
                        previous_stage_id: oldStageId,
                        status: current.status,
                        contact_id: current.contactId,
                    },
                });
            } catch (err) {
                console.warn("Inngest send error in moveOpportunity:", err);
            }
        }

        return { success: true };
    }

    static async updateOpportunityStatus(
        tenantId: string,
        id: string,
        status: OpportunityStatus
    ) {
        const [existing] = await db
            .select({ status: opportunities.status, stageId: opportunities.pipelineStageId, contactId: opportunities.contactId })
            .from(opportunities)
            .where(and(eq(opportunities.id, id), eq(opportunities.tenantId, tenantId)))
            .limit(1);

        const [updated] = await db
            .update(opportunities)
            .set({ status })
            .where(and(eq(opportunities.id, id), eq(opportunities.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Opportunity not found or access denied");
        }

        if (existing && existing.status !== status) {
            try {
                await inngest.send({
                    name: "opportunity.status_changed",
                    data: {
                        opportunity_id: updated.id,
                        tenant_id: tenantId,
                        status: updated.status,
                        previous_status: existing.status,
                        contact_id: updated.contactId,
                    },
                });

                // If marked won or lost, also dispatch stage_changed event for deal-won workflows
                await inngest.send({
                    name: "opportunity.stage_changed",
                    data: {
                        opportunity_id: updated.id,
                        tenant_id: tenantId,
                        stage_id: updated.pipelineStageId,
                        status: updated.status,
                        contact_id: updated.contactId,
                    },
                });
            } catch (err) {
                console.warn("Inngest send error in updateOpportunityStatus:", err);
            }
        }

        return updated;
    }

    static async deleteOpportunity(tenantId: string, id: string) {
        const [deleted] = await db
            .delete(opportunities)
            .where(and(eq(opportunities.id, id), eq(opportunities.tenantId, tenantId)))
            .returning();

        if (!deleted) {
            throw new Error("Opportunity not found or access denied");
        }
        return deleted;
    }

    static async createPipeline(tenantId: string, userId: string, name: string): Promise<PipelineWithStages> {
        const validated = pipelineSchema.parse({ name });

        const [pipeline] = await db
            .insert(pipelines)
            .values({
                tenantId,
                name: validated.name,
                createdBy: userId,
            })
            .returning();

        const defaultStages = [
            { name: "New Lead", orderIndex: 0 },
            { name: "Contacted", orderIndex: 1 },
            { name: "Proposal Sent", orderIndex: 2 },
            { name: "Closed Won", orderIndex: 3 },
            { name: "Closed Lost", orderIndex: 4 },
        ].map((s) => ({
            pipelineId: pipeline.id,
            tenantId,
            name: s.name,
            orderIndex: s.orderIndex,
        }));

        const insertedStages = await db.insert(pipelineStages).values(defaultStages).returning();

        return {
            id: pipeline.id,
            tenant_id: pipeline.tenantId,
            name: pipeline.name,
            created_at: pipeline.createdAt.toISOString(),
            created_by: pipeline.createdBy || userId,
            stages: insertedStages.map((s) => ({
                id: s.id,
                pipeline_id: s.pipelineId,
                tenant_id: s.tenantId,
                name: s.name,
                order_index: s.orderIndex,
                created_at: s.createdAt.toISOString(),
            })),
        };
    }

    static async updatePipeline(tenantId: string, id: string, name: string) {
        const validated = pipelineSchema.parse({ name });

        const [updated] = await db
            .update(pipelines)
            .set({ name: validated.name })
            .where(and(eq(pipelines.id, id), eq(pipelines.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Pipeline not found or access denied");
        }
        return updated;
    }

    static async deletePipeline(tenantId: string, id: string) {
        const [deleted] = await db
            .delete(pipelines)
            .where(and(eq(pipelines.id, id), eq(pipelines.tenantId, tenantId)))
            .returning();

        if (!deleted) {
            throw new Error("Pipeline not found or access denied");
        }
        return deleted;
    }

    static async createStage(tenantId: string, pipelineId: string, name: string): Promise<PipelineStage> {
        const validated = stageSchema.parse({ name });

        const [pipeline] = await db
            .select({ id: pipelines.id })
            .from(pipelines)
            .where(and(eq(pipelines.id, pipelineId), eq(pipelines.tenantId, tenantId)))
            .limit(1);
        if (!pipeline) throw new Error("Pipeline not found or access denied");

        const existingStages = await db
            .select({ orderIndex: pipelineStages.orderIndex })
            .from(pipelineStages)
            .where(and(eq(pipelineStages.pipelineId, pipelineId), eq(pipelineStages.tenantId, tenantId)))
            .orderBy(desc(pipelineStages.orderIndex))
            .limit(1);

        const nextOrder = (existingStages[0]?.orderIndex ?? -1) + 1;

        const [created] = await db
            .insert(pipelineStages)
            .values({
                pipelineId,
                tenantId,
                name: validated.name,
                orderIndex: nextOrder,
            })
            .returning();

        return {
            id: created.id,
            pipeline_id: created.pipelineId,
            tenant_id: created.tenantId,
            name: created.name,
            order_index: created.orderIndex,
            created_at: created.createdAt.toISOString(),
        };
    }

    static async updateStage(tenantId: string, stageId: string, name: string): Promise<PipelineStage> {
        const validated = stageSchema.parse({ name });

        const [updated] = await db
            .update(pipelineStages)
            .set({ name: validated.name })
            .where(and(eq(pipelineStages.id, stageId), eq(pipelineStages.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Stage not found or access denied");
        }

        return {
            id: updated.id,
            pipeline_id: updated.pipelineId,
            tenant_id: updated.tenantId,
            name: updated.name,
            order_index: updated.orderIndex,
            created_at: updated.createdAt.toISOString(),
        };
    }

    static async deleteStage(tenantId: string, stageId: string) {
        // Verify stage belongs to tenant
        const [stage] = await db
            .select()
            .from(pipelineStages)
            .where(and(eq(pipelineStages.id, stageId), eq(pipelineStages.tenantId, tenantId)))
            .limit(1);
        if (!stage) throw new Error("Stage not found or access denied");

        // Guard: check if stage has opportunities
        const [oppCount] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(opportunities)
            .where(and(eq(opportunities.pipelineStageId, stageId), eq(opportunities.tenantId, tenantId)));

        if (oppCount && oppCount.count > 0) {
            throw new Error(
                `Cannot delete stage "${stage.name}" because it contains ${oppCount.count} active deal(s). Please move or delete the deals first.`
            );
        }

        const [deleted] = await db
            .delete(pipelineStages)
            .where(and(eq(pipelineStages.id, stageId), eq(pipelineStages.tenantId, tenantId)))
            .returning();

        if (!deleted) {
            throw new Error("Stage not found or access denied");
        }

        // Re-index remaining stages for this pipeline
        const remainingStages = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(and(eq(pipelineStages.pipelineId, stage.pipelineId), eq(pipelineStages.tenantId, tenantId)))
            .orderBy(asc(pipelineStages.orderIndex), asc(pipelineStages.createdAt));

        for (let i = 0; i < remainingStages.length; i++) {
            await db
                .update(pipelineStages)
                .set({ orderIndex: i })
                .where(eq(pipelineStages.id, remainingStages[i].id));
        }

        return { success: true };
    }

    static async getContactOpportunities(tenantId: string, contactId: string) {
        const rows = await db
            .select({
                opportunity: opportunities,
                stage: pipelineStages,
                pipeline: pipelines,
            })
            .from(opportunities)
            .innerJoin(pipelineStages, eq(opportunities.pipelineStageId, pipelineStages.id))
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(
                and(
                    eq(opportunities.tenantId, tenantId),
                    eq(opportunities.contactId, contactId)
                )
            )
            .orderBy(desc(opportunities.createdAt));

        return rows.map(({ opportunity: o, stage: s, pipeline: p }) => ({
            id: o.id,
            title: o.title,
            value: o.value ? parseFloat(o.value) : 0,
            status: o.status as OpportunityStatus,
            created_at: o.createdAt.toISOString(),
            pipeline_id: p.id,
            pipeline_name: p.name,
            stage_id: s.id,
            stage_name: s.name,
        }));
    }
}
