export async function handleUpdateOpportunity(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
    supabase: any
) {
    const opportunityId = triggerData.opportunity?.id || triggerData.id;
    if (!opportunityId) return;

    const updates: Record<string, any> = {};
    if (config.status) updates.status = config.status;
    if (config.pipeline_stage_id) updates.pipeline_stage_id = config.pipeline_stage_id;

    await supabase.from("opportunities")
        .update(updates)
        .eq("id", opportunityId)
        .eq("tenant_id", tenantId);
}
