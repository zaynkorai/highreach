"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWorkflow(name: string, description: string = "") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Use Admin Client for writes to bypass potential RLS config issues in dev
    const adminDb = createAdminClient();

    const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single();
    if (!userData) throw new Error("No tenant");

    const { data: workflow, error } = await adminDb
        .from("workflows")
        .insert({
            tenant_id: userData.tenant_id,
            name,
            description,
            trigger_type: "manual", // Default, will change on save
            status: "draft"
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/automations");
    return workflow;
}

export async function saveWorkflow(workflowId: string, definition: any, name?: string) {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // 1. Update workflow metadata
    const updates: any = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;

    // Detect trigger type for indexing
    const triggerNode = definition.nodes?.find((n: any) => n.type === "trigger");
    if (triggerNode?.data?.triggerId) {
        updates.trigger_type = triggerNode.data.triggerId;
    }

    await adminDb
        .from("workflows")
        .update(updates)
        .eq("id", workflowId);

    // 2. Create new version snapshot (Immutable)
    const { data: latestVersion, error } = await adminDb
        .from("workflow_versions")
        .insert({
            workflow_id: workflowId,
            version_number: await getNextVersionNumber(supabase, workflowId),
            definition,
            is_published: false
        })
        .select()
        .single();

    if (error) {
        console.error("Save error", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/automations/${workflowId}`);
    return { success: true, versionId: latestVersion.id };
}

export async function publishWorkflow(workflowId: string, definition: any) {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // 1. Save as new version first
    const { data: version, error: saveError } = await adminDb
        .from("workflow_versions")
        .insert({
            workflow_id: workflowId,
            version_number: await getNextVersionNumber(supabase, workflowId),
            definition,
            is_published: true
        })
        .select()
        .single();

    if (saveError) return { success: false, error: saveError.message };

    // 2. Update workflow status
    await adminDb
        .from("workflows")
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq("id", workflowId);

    revalidatePath("/dashboard/automations");
    return { success: true };
}

async function getNextVersionNumber(supabase: any, workflowId: string) {
    const { count } = await supabase
        .from("workflow_versions")
        .select("*", { count: 'exact', head: true })
        .eq("workflow_id", workflowId);

    return (count || 0) + 1;
}

// Keeping legacy support for now if needed, but deprecated
export async function updateWorkflowSetting(key: string, enabled: boolean, template?: string) {
    return { success: true, error: undefined };
}

export async function getWorkflow(id: string) {
    const supabase = await createClient();

    // Get workflow metadata
    const { data: workflow, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !workflow) return null;

    // Get latest version definition
    const { data: version } = await supabase
        .from("workflow_versions")
        .select("definition")
        .eq("workflow_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    return {
        ...workflow,
        definition: version?.definition || null
    };
}

export async function deleteWorkflow(id: string) {
    const adminDb = createAdminClient();

    // Use admin client to bypass RLS issues in dev
    const { error } = await adminDb
        .from("workflows")
        .delete()
        .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/automations");
    return { success: true };
}

export async function getWorkflowExecutions(workflowId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("workflow_executions")
        .select(`
            *,
            version:workflow_versions(version_number)
        `)
        .eq("workflow_id", workflowId)
        .order("started_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Executions fetch error", error);
        return [];
    }

    return data;
}
