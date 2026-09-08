import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function handleAddTag(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const contactId = triggerData.contact?.id || triggerData.id;
    const newTag = config.tag;

    if (!contactId || !newTag) return;

    const [contact] = await db
        .select({ tags: contacts.tags })
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)))
        .limit(1);

    if (!contact) return;

    const currentTags = Array.isArray(contact.tags) ? contact.tags : [];

    if (!currentTags.includes(newTag)) {
        await db
            .update(contacts)
            .set({ tags: [...currentTags, newTag] })
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)));
    }
}
