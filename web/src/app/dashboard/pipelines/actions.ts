"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { opportunitySchema, OpportunityFormData } from "@/lib/validations/opportunity";
import { inngest } from "@/lib/inngest/client";

export async function getPipelines() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("getPipelines Auth Error:", authError);
            return { success: false, error: "Unauthorized" };
        }

        const { data, error } = await supabase
            .from("pipelines")
            .select(`
                *,
                stages:pipeline_stages(*)
            `)
            .order("created_at", { ascending: true });

        if (error) return { success: false, error: error.message };

        // If no pipelines exist, seed a default one
        if (data.length === 0) {
            return await seedDefaultPipeline();
        }

        // Sort stages by order_index
        const sortedPipelines = data.map(p => ({
            ...p,
            stages: (p.stages || []).sort((a: any, b: any) => a.order_index - b.order_index)
        }));

        return { success: true, data: sortedPipelines };
    } catch (e: any) {
        console.error("getPipelines Error:", e);
        return { success: false, error: "Failed to fetch pipelines" };
    }
}

async function seedDefaultPipeline() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!userData?.tenant_id) return { success: false, error: "No tenant assigned" };

        // 1. Create Pipeline
        const { data: pipeline, error: pError } = await supabase
            .from("pipelines")
            .insert({
                tenant_id: userData.tenant_id,
                name: "Sales Pipeline",
                created_by: user.id
            })
            .select()
            .single();

        if (pError) return { success: false, error: pError.message };

        // 2. Create Default Stages
        const defaultStages = [
            { name: "Leads", order_index: 0 },
            { name: "Interested", order_index: 1 },
            { name: "Demo Scheduled", order_index: 2 },
            { name: "Negotiation", order_index: 3 },
            { name: "Closed Won", order_index: 4 },
            { name: "Closed Lost", order_index: 5 }
        ].map(s => ({
            ...s,
            pipeline_id: pipeline.id,
            tenant_id: userData.tenant_id
        }));

        const { error: sError } = await supabase
            .from("pipeline_stages")
            .insert(defaultStages);

        if (sError) return { success: false, error: sError.message };

        // Fetch again with stages
        const { data: finalData, error: fError } = await supabase
            .from("pipelines")
            .select(`
                *,
                stages:pipeline_stages(*)
            `)
            .eq("id", pipeline.id)
            .single();

        if (fError) return { success: false, error: fError.message };

        return { success: true, data: [finalData] };
    } catch (e: any) {
        return { success: false, error: "Failed to seed default pipeline" };
    }
}

export async function getOpportunities(pipelineId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // 1. Get stage IDs for this pipeline
        const { data: stages } = await supabase
            .from("pipeline_stages")
            .select("id")
            .eq("pipeline_id", pipelineId);

        const stageIds = stages?.map(s => s.id) || [];

        const { data, error } = await supabase
            .from("opportunities")
            .select(`
                *,
                contact:contacts(*)
            `)
            .eq("status", "open")
            .in("pipeline_stage_id", stageIds)
            .order("order_index", { ascending: true });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch opportunities" };
    }
}

export async function createOpportunity(formData: OpportunityFormData) {
    try {
        const supabase = await createClient();
        const validated = opportunitySchema.parse(formData);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!userData?.tenant_id) return { success: false, error: "No tenant assigned" };

        // Get max order_index for this stage
        const { data: existing } = await supabase
            .from("opportunities")
            .select("order_index")
            .eq("pipeline_stage_id", validated.pipelineStageId)
            .order("order_index", { ascending: false })
            .limit(1);

        const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

        const { data, error } = await supabase
            .from("opportunities")
            .insert({
                tenant_id: userData.tenant_id,
                contact_id: validated.contactId,
                pipeline_stage_id: validated.pipelineStageId,
                title: validated.title,
                value: validated.value,
                status: validated.status,
                order_index: nextOrder,
                created_by: user.id
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        revalidatePath("/dashboard/pipelines");
        return { success: true, data };
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
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // 1. Update the opportunity
        const { error: updateError } = await supabase
            .from("opportunities")
            .update({
                pipeline_stage_id: newStageId,
                order_index: newOrderIndex
            })
            .eq("id", opportunityId);

        if (updateError) return { success: false, error: updateError.message };

        revalidatePath("/dashboard/pipelines");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to move opportunity" };
    }
}

export async function updateOpportunityStatus(id: string, status: 'won' | 'lost') {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const { data: oppData, error: fetchError } = await supabase
            .from("opportunities")
            .select("tenant_id, pipeline_stage_id")
            .eq("id", id)
            .single();

        if (fetchError || !oppData) return { success: false, error: "Opportunity not found" };

        const { error } = await supabase
            .from("opportunities")
            .update({ status })
            .eq("id", id);

        if (error) return { success: false, error: error.message };

        await inngest.send({
            name: "opportunity.stage_changed",
            data: {
                opportunity_id: id,
                tenant_id: oppData.tenant_id,
                stage_id: oppData.pipeline_stage_id,
                status,
            },
        });

        revalidatePath("/dashboard/pipelines");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to update status" };
    }
}
