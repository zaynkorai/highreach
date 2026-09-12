import { db } from "@/lib/db";
import { contacts, contactActivities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatTemplate } from "../utils/helpers";

export async function handleUpdateContact(
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const contactId = triggerData.contact?.id || triggerData.contact_id || triggerData.id;
    if (!contactId) return;

    const updates: Partial<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        source: string;
        notes: string;
    }> = {};

    if (config.first_name) updates.firstName = formatTemplate(config.first_name, triggerData);
    if (config.last_name) updates.lastName = formatTemplate(config.last_name, triggerData);
    if (config.email) updates.email = formatTemplate(config.email, triggerData);
    if (config.phone) updates.phone = formatTemplate(config.phone, triggerData);
    if (config.source) updates.source = formatTemplate(config.source, triggerData);
    if (config.notes) updates.notes = formatTemplate(config.notes, triggerData);

    // Support generic field & value pattern (e.g. { field: "notes", value: "VIP lead" })
    if (config.field && config.value !== undefined) {
        const fieldName = config.field;
        const fieldValue = formatTemplate(String(config.value), triggerData);
        if (fieldName === "first_name" || fieldName === "firstName") updates.firstName = fieldValue;
        else if (fieldName === "last_name" || fieldName === "lastName") updates.lastName = fieldValue;
        else if (fieldName === "email") updates.email = fieldValue;
        else if (fieldName === "phone") updates.phone = fieldValue;
        else if (fieldName === "source") updates.source = fieldValue;
        else if (fieldName === "notes") updates.notes = fieldValue;
    }

    if (Object.keys(updates).length > 0) {
        await db
            .update(contacts)
            .set(updates)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)));

        await db.insert(contactActivities).values({
            contactId,
            tenantId,
            type: "contact_updated",
            content: `Contact updated via workflow: ${Object.keys(updates).join(", ")}`,
            metadata: { updates }
        });
    }
}
