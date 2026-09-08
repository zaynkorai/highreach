"use server";

import { getSessionWithRole } from "@/lib/auth/session";
import { db, workflows, workflowVersions, workflowExecutions } from "@/lib/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createWorkflow(name: string, description: string = "") {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    const [workflow] = await db
        .insert(workflows)
        .values({
            tenantId: session.tenantId,
            name,
            description,
            triggerType: "manual",
            status: "draft",
        })
        .returning();

    revalidatePath("/dashboard/automations");
    return {
        id: workflow.id,
        tenant_id: workflow.tenantId,
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.triggerType,
        status: workflow.status,
        created_at: workflow.createdAt.toISOString(),
        updated_at: workflow.updatedAt.toISOString(),
    };
}

export async function saveWorkflow(workflowId: string, definition: any, name?: string) {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    return await db.transaction(async (tx) => {
        // 1. Verify workflow belongs to this tenant
        const [existing] = await tx
            .select({ id: workflows.id })
            .from(workflows)
            .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, session.tenantId)))
            .limit(1);

        if (!existing) {
            throw new Error("Workflow not found or access denied");
        }

        // 2. Update workflow metadata
        const updates: Partial<typeof workflows.$inferInsert> = {
            updatedAt: new Date(),
        };
        if (name) updates.name = name;

        const triggerNode = definition.nodes?.find((n: any) => n.type === "trigger");
        if (triggerNode?.data?.triggerId) {
            updates.triggerType = triggerNode.data.triggerId;
        }

        await tx
            .update(workflows)
            .set(updates)
            .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, session.tenantId)));

        // 3. Create new version snapshot (Immutable)
        const nextVersion = await getNextVersionNumber(workflowId, tx);

        const [latestVersion] = await tx
            .insert(workflowVersions)
            .values({
                workflowId,
                versionNumber: nextVersion,
                definition,
                isPublished: false,
                createdBy: session.user.id,
            })
            .returning();

        revalidatePath(`/dashboard/automations/${workflowId}`);
        return { success: true, versionId: latestVersion.id };
    });
}

export async function publishWorkflow(workflowId: string, definition: any): Promise<{ success: boolean; error?: string }> {
    const session = await getSessionWithRole();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await db.transaction(async (tx) => {
            // 1. Verify workflow belongs to this tenant
            const [existing] = await tx
                .select({ id: workflows.id })
                .from(workflows)
                .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, session.tenantId)))
                .limit(1);

            if (!existing) {
                throw new Error("Workflow not found or access denied");
            }

            const nextVersion = await getNextVersionNumber(workflowId, tx);

            await tx
                .insert(workflowVersions)
                .values({
                    workflowId,
                    versionNumber: nextVersion,
                    definition,
                    isPublished: true,
                    createdBy: session.user.id,
                });

            await tx
                .update(workflows)
                .set({
                    status: "published",
                    updatedAt: new Date(),
                })
                .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, session.tenantId)));
        });

        revalidatePath("/dashboard/automations");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

async function getNextVersionNumber(workflowId: string, tx: any = db): Promise<number> {
    const [result] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(workflowVersions)
        .where(eq(workflowVersions.workflowId, workflowId));

    return (result?.count || 0) + 1;
}

export async function updateWorkflowSetting(key: string, enabled: boolean, template?: string) {
    return { success: true, error: undefined };
}

export async function getWorkflow(id: string) {
    const session = await getSessionWithRole();
    if (!session) return null;

    const [workflow] = await db
        .select()
        .from(workflows)
        .where(
            and(
                eq(workflows.id, id),
                eq(workflows.tenantId, session.tenantId)
            )
        )
        .limit(1);

    if (!workflow) return null;

    const [version] = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.workflowId, id))
        .orderBy(desc(workflowVersions.createdAt))
        .limit(1);

    return {
        id: workflow.id,
        tenant_id: workflow.tenantId,
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.triggerType,
        status: workflow.status,
        created_at: workflow.createdAt.toISOString(),
        updated_at: workflow.updatedAt.toISOString(),
        definition: version?.definition || null,
    };
}

export async function deleteWorkflow(id: string) {
    const session = await getSessionWithRole();
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await db
            .delete(workflows)
            .where(
                and(
                    eq(workflows.id, id),
                    eq(workflows.tenantId, session.tenantId)
                )
            );

        revalidatePath("/dashboard/automations");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getWorkflowExecutions(workflowId: string) {
    const session = await getSessionWithRole();
    if (!session) return [];

    try {
        const rows = await db
            .select()
            .from(workflowExecutions)
            .where(
                and(
                    eq(workflowExecutions.workflowId, workflowId),
                    eq(workflowExecutions.tenantId, session.tenantId)
                )
            )
            .orderBy(desc(workflowExecutions.startedAt))
            .limit(50);

        return rows.map((r) => ({
            id: r.id,
            workflow_id: r.workflowId,
            version_id: r.versionId,
            tenant_id: r.tenantId,
            trigger_data: r.triggerData,
            status: r.status,
            current_step_id: r.currentStepId,
            context: r.context,
            started_at: r.startedAt.toISOString(),
            completed_at: r.completedAt ? r.completedAt.toISOString() : null,
            error_message: r.errorMessage,
        }));
    } catch (error) {
        console.error("Executions fetch error", error);
        return [];
    }
}

export async function getServiceConfigStatus() {
    return {
        telnyx: !!process.env.TELNYX_API_KEY,
        resend: !!process.env.RESEND_API_KEY,
    };
}
