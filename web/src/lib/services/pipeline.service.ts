import { db, pipelines, pipelineStages, opportunities, contacts } from "@/lib/db";
import { eq, asc, desc, and, inArray } from "drizzle-orm";
import { opportunitySchema, OpportunityFormData } from "@/lib/validations/opportunity";

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

    static async createOpportunity(tenantId: string, userId: string, formData: OpportunityFormData) {
        const validated = opportunitySchema.parse(formData);

        // Verify contact belongs to tenant
        const [contact] = await db
            .select({ id: contacts.id })
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
            .where(eq(opportunities.pipelineStageId, validated.pipelineStageId))
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

        return created;
    }

    static async moveOpportunity(
        tenantId: string,
        opportunityId: string,
        newStageId: string,
        newOrderIndex: number
    ) {
        const [stage] = await db
            .select({ id: pipelineStages.id })
            .from(pipelineStages)
            .where(and(eq(pipelineStages.id, newStageId), eq(pipelineStages.tenantId, tenantId)))
            .limit(1);
        if (!stage) throw new Error("Target pipeline stage not found or access denied");

        const [updated] = await db
            .update(opportunities)
            .set({
                pipelineStageId: newStageId,
                orderIndex: newOrderIndex,
            })
            .where(
                and(
                    eq(opportunities.id, opportunityId),
                    eq(opportunities.tenantId, tenantId)
                )
            )
            .returning();

        if (!updated) {
            throw new Error("Opportunity not found or access denied");
        }
        return updated;
    }

    static async updateOpportunityStatus(
        tenantId: string,
        id: string,
        status: "won" | "lost"
    ) {
        const [updated] = await db
            .update(opportunities)
            .set({ status })
            .where(and(eq(opportunities.id, id), eq(opportunities.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Opportunity not found or access denied");
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

    static async createPipeline(tenantId: string, userId: string, name: string) {
        const [pipeline] = await db
            .insert(pipelines)
            .values({
                tenantId,
                name,
                createdBy: userId,
            })
            .returning();

        const defaultStages = [
            { name: "New Lead", orderIndex: 0 },
            { name: "Contacted", orderIndex: 1 },
            { name: "Proposal Sent", orderIndex: 2 },
            { name: "Closed", orderIndex: 3 },
        ].map((s) => ({
            pipelineId: pipeline.id,
            tenantId,
            name: s.name,
            orderIndex: s.orderIndex,
        }));

        await db.insert(pipelineStages).values(defaultStages);
        return pipeline;
    }

    static async updatePipeline(tenantId: string, id: string, name: string) {
        const [updated] = await db
            .update(pipelines)
            .set({ name })
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
}
