"use server";

import { requirePermission } from "@/lib/rbac/guard";
import { withPermission } from "@/lib/actions/action-handler";
import { ContactService } from "@/lib/services/contact.service";
import { revalidatePath } from "next/cache";
import type { CreateContactDTO, UpdateContactDTO } from "@/types/contact";

export async function createContact(data: CreateContactDTO) {
    return await withPermission("contacts.write", async (session) => {
        const contact = await ContactService.createContact(session.tenantId, data);
        revalidatePath("/dashboard/contacts");
        return contact;
    });
}

export async function updateContact(id: string, data: UpdateContactDTO) {
    return await withPermission("contacts.write", async (session) => {
        const updated = await ContactService.updateContact(session.tenantId, id, data);
        revalidatePath("/dashboard/contacts");
        return updated;
    });
}

export async function deleteContact(id: string) {
    return await withPermission("contacts.delete", async (session) => {
        const deleted = await ContactService.deleteContact(session.tenantId, id);
        revalidatePath("/dashboard/contacts");
        return deleted;
    });
}

export async function uploadCSV(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false as const, error: "No file uploaded" };
        }

        const session = await requirePermission("contacts.write");
        const text = await file.text();
        const result = await ContactService.parseAndImportCsv(session.tenantId, text);
        revalidatePath("/dashboard/contacts");

        return {
            success: true as const,
            successCount: result.successCount,
            failedCount: result.failedCount,
            details: result.details,
        };
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : "Failed to upload CSV";
        return { success: false as const, error };
    }
}

export async function bulkDeleteContacts(ids: string[]) {
    return await withPermission("contacts.delete", async (session) => {
        const result = await ContactService.bulkDeleteContacts(session.tenantId, ids);
        revalidatePath("/dashboard/contacts");
        return result;
    });
}

export async function bulkAddTags(ids: string[], tags: string[]) {
    return await withPermission("contacts.write", async (session) => {
        await ContactService.bulkAddTags(session.tenantId, ids, tags);
        revalidatePath("/dashboard/contacts");
        return { success: true };
    });
}

export async function getContactActivities(contactId: string) {
    return await withPermission("contacts.read", async (session) => {
        const rows = await ContactService.getContactActivities(session.tenantId, contactId);
        return rows.map((a) => ({
            id: a.id,
            contact_id: a.contactId,
            tenant_id: a.tenantId,
            type: a.type as "email" | "sms" | "note" | "call_log" | "system",
            content: a.content,
            metadata: (a.metadata || {}) as Record<string, unknown>,
            created_at: a.createdAt.toISOString(),
            created_by: a.createdBy || "",
        }));
    });
}

export async function createActivity(
    contactId: string,
    type: "note" | "call_log" | "sms" | "email" | "system",
    content: string
) {
    return await withPermission("contacts.write", async (session) => {
        await ContactService.createContactActivity(
            session.tenantId,
            contactId,
            session.user.id,
            type,
            content
        );
        return { success: true };
    });
}

export async function getContactViews() {
    return await withPermission("contacts.read", async (session) => {
        return await ContactService.getContactViews(session.tenantId);
    });
}

export async function saveContactView(name: string, filters: unknown) {
    return await withPermission("contacts.write", async (session) => {
        await ContactService.saveContactView(session.tenantId, session.user.id, name, filters);
        revalidatePath("/dashboard/contacts");
        return { success: true };
    });
}

export async function deleteContactView(id: string) {
    return await withPermission("contacts.delete", async (session) => {
        await ContactService.deleteContactView(session.tenantId, id);
        revalidatePath("/dashboard/contacts");
        return { success: true };
    });
}
