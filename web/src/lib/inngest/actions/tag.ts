export async function handleAddTag(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
    supabase: any
) {
    const contactId = triggerData.contact?.id || triggerData.id;
    const newTag = config.tag;

    if (!contactId || !newTag) return;

    const { data: contact } = await supabase
        .from("contacts")
        .select("tags")
        .eq("id", contactId)
        .eq("tenant_id", tenantId)
        .single();

    if (!contact) return;

    const currentTags = Array.isArray(contact?.tags) ? contact.tags : [];

    if (!currentTags.includes(newTag)) {
        await supabase.from("contacts")
            .update({ tags: [...currentTags, newTag] })
            .eq("id", contactId)
            .eq("tenant_id", tenantId);
    }
}
