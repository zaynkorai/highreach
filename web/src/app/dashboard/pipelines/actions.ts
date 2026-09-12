"use server";

import { withPermission } from "@/lib/actions/action-handler";
import { PipelineService } from "@/lib/services/pipeline.service";
import { revalidatePath } from "next/cache";
import type { OpportunityFormData, UpdateOpportunityFormData } from "@/lib/validations/opportunity";
import type { OpportunityStatus } from "@/types/pipeline";

export async function getPipelines() {
    return await withPermission("pipelines.read", async (session) => {
        return await PipelineService.getPipelines(session.tenantId, session.user.id);
    });
}

export async function getOpportunities(pipelineId?: string) {
    return await withPermission("pipelines.read", async (session) => {
        return await PipelineService.getOpportunities(session.tenantId, pipelineId);
    });
}

export async function createOpportunity(formData: OpportunityFormData) {
    return await withPermission("pipelines.write", async (session) => {
        const created = await PipelineService.createOpportunity(
            session.tenantId,
            session.user.id,
            formData
        );
        revalidatePath("/dashboard/pipelines");
        return created;
    });
}

export async function updateOpportunity(id: string, formData: UpdateOpportunityFormData) {
    return await withPermission("pipelines.write", async (session) => {
        const updated = await PipelineService.updateOpportunity(
            session.tenantId,
            id,
            formData
        );
        revalidatePath("/dashboard/pipelines");
        return updated;
    });
}

export async function moveOpportunity(
    opportunityId: string,
    newStageId: string,
    newOrderIndex: number
) {
    return await withPermission("pipelines.write", async (session) => {
        await PipelineService.moveOpportunity(
            session.tenantId,
            opportunityId,
            newStageId,
            newOrderIndex
        );
        revalidatePath("/dashboard/pipelines");
        return { success: true };
    });
}

export async function updateOpportunityStatus(id: string, status: OpportunityStatus) {
    return await withPermission("pipelines.write", async (session) => {
        const updated = await PipelineService.updateOpportunityStatus(session.tenantId, id, status);
        revalidatePath("/dashboard/pipelines");
        return updated;
    });
}

export async function deleteOpportunity(id: string) {
    return await withPermission("pipelines.delete", async (session) => {
        await PipelineService.deleteOpportunity(session.tenantId, id);
        revalidatePath("/dashboard/pipelines");
        return { success: true };
    });
}

export async function createPipeline(name: string) {
    return await withPermission("pipelines.write", async (session) => {
        const pipeline = await PipelineService.createPipeline(session.tenantId, session.user.id, name);
        revalidatePath("/dashboard/pipelines");
        return pipeline;
    });
}

export async function updatePipeline(id: string, name: string) {
    return await withPermission("pipelines.write", async (session) => {
        await PipelineService.updatePipeline(session.tenantId, id, name);
        revalidatePath("/dashboard/pipelines");
        return { success: true };
    });
}

export async function deletePipeline(id: string) {
    return await withPermission("pipelines.delete", async (session) => {
        await PipelineService.deletePipeline(session.tenantId, id);
        revalidatePath("/dashboard/pipelines");
        return { success: true };
    });
}

export async function createStage(pipelineId: string, name: string) {
    return await withPermission("pipelines.write", async (session) => {
        const stage = await PipelineService.createStage(session.tenantId, pipelineId, name);
        revalidatePath("/dashboard/pipelines");
        return stage;
    });
}

export async function updateStage(stageId: string, name: string) {
    return await withPermission("pipelines.write", async (session) => {
        const stage = await PipelineService.updateStage(session.tenantId, stageId, name);
        revalidatePath("/dashboard/pipelines");
        return stage;
    });
}

export async function deleteStage(stageId: string) {
    return await withPermission("pipelines.delete", async (session) => {
        await PipelineService.deleteStage(session.tenantId, stageId);
        revalidatePath("/dashboard/pipelines");
        return { success: true };
    });
}

export async function getContactOpportunities(contactId: string) {
    return await withPermission("pipelines.read", async (session) => {
        return await PipelineService.getContactOpportunities(session.tenantId, contactId);
    });
}

