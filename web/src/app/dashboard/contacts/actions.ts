"use server";

import { getSessionWithRole } from "@/lib/auth/session";
import { db, contacts, contactActivities, contactViews } from "@/lib/db";
import { eq, inArray, desc, asc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { CreateContactDTO, UpdateContactDTO } from "@/types/contact";
import { contactSchema } from "@/lib/validations/contact";
import { inngest } from "@/lib/inngest/client";
import { parse } from "csv-parse/sync";

export async function createContact(data: CreateContactDTO) {
    try {
        const session = await getSessionWithRole();
        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        // 1. Validation Logic
        const validatedFields = contactSchema.safeParse({
            firstName: data.first_name,
            lastName: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            tags: data.tags || [],
            source: data.source || "manual",
        });

        if (!validatedFields.success) {
            return { success: false, error: "Validation failed", details: validatedFields.error.flatten() };
        }

        const [insertedData] = await db
            .insert(contacts)
            .values({
                tenantId: session.tenantId,
                firstName: validatedFields.data.firstName,
                lastName: validatedFields.data.lastName || null,
                email: validatedFields.data.email || null,
                phone: validatedFields.data.phone || null,
                source: validatedFields.data.source || "manual",
                tags: validatedFields.data.tags || [],
            })
            .returning();

        if (insertedData) {
            try {
                await inngest.send({
                    name: "contact.created",
                    data: {
                        contact_id: insertedData.id,
                        tenant_id: session.tenantId,
                        source: insertedData.source || "manual",
                    },
                });
            } catch (err) {
                console.warn("Inngest send error:", err);
            }
        }

        revalidatePath("/dashboard/contacts");

        const formatted = {
            id: insertedData.id,
            tenant_id: insertedData.tenantId,
            first_name: insertedData.firstName,
            last_name: insertedData.lastName,
            email: insertedData.email,
            phone: insertedData.phone,
            tags: insertedData.tags || [],
            source: insertedData.source,
            notes: insertedData.notes,
            created_at: insertedData.createdAt.toISOString(),
            updated_at: insertedData.updatedAt.toISOString(),
        };

        return { success: true, data: formatted };
    } catch (e: any) {
        console.error("Create Contact Error:", e);
        return { success: false, error: e.message || "An unexpected error occurred" };
    }
}

export async function updateContact(id: string, data: UpdateContactDTO) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const validatedFields = contactSchema.safeParse({
            firstName: data.first_name,
            lastName: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            tags: data.tags || [],
            source: data.source || "manual",
        });

        if (!validatedFields.success) {
            return { success: false, error: "Validation failed", details: validatedFields.error.flatten() };
        }

        await db
            .update(contacts)
            .set({
                firstName: validatedFields.data.firstName,
                lastName: validatedFields.data.lastName || null,
                email: validatedFields.data.email || null,
                phone: validatedFields.data.phone || null,
                tags: validatedFields.data.tags,
                source: validatedFields.data.source,
                updatedAt: new Date(),
            })
            .where(and(eq(contacts.id, id), eq(contacts.tenantId, session.tenantId)));

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        console.error("Update Contact Error:", e);
        return { success: false, error: e.message || "An unexpected error occurred" };
    }
}

export async function deleteContact(id: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await db
            .delete(contacts)
            .where(and(eq(contacts.id, id), eq(contacts.tenantId, session.tenantId)));

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        console.error("Delete Contact Error:", e);
        return { success: false, error: e.message || "An unexpected error occurred" };
    }
}

export async function uploadCSV(formData: FormData) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file uploaded" };
        }

        const text = await file.text();

        // Parse CSV
        let rawData;
        try {
            rawData = parse(text, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        } catch (e: any) {
            return { success: false, error: "Failed to parse CSV: " + (e.message || "Invalid format") };
        }

        if (!rawData || rawData.length === 0) {
            return { success: false, error: "No records found in CSV" };
        }

        let successCount = 0;
        const failedRows: any[] = [];
        const contactsToInsert: any[] = [];

        // Iterate and Validate
        for (let i = 0; i < (rawData as any[]).length; i++) {
            const row = (rawData as any[])[i];
            const mappedData = {
                firstName: row["firstName"] || row["First Name"] || row["first name"] || row["first_name"] || row["Name"] || row["name"],
                lastName: row["lastName"] || row["Last Name"] || row["last name"] || row["last_metric"] || row["last_name"] || "",
                email: row["email"] || row["Email"] || row["E-mail"] || "",
                phone: row["phone"] || row["Phone"] || row["Phone Number"] || row["phone_number"] || "",
            };

            const validatedFields = contactSchema.safeParse(mappedData);

            if (validatedFields.success) {
                contactsToInsert.push({
                    tenantId: session.tenantId,
                    firstName: validatedFields.data.firstName,
                    lastName: validatedFields.data.lastName || null,
                    email: validatedFields.data.email || null,
                    phone: validatedFields.data.phone || null,
                    source: "import",
                    tags: [],
                });
            } else {
                failedRows.push({
                    row: i + 1,
                    data: mappedData,
                    errors: validatedFields.error.flatten().fieldErrors,
                });
            }
        }

        if (contactsToInsert.length > 0) {
            await db.insert(contacts).values(contactsToInsert);
            successCount = contactsToInsert.length;
        }

        revalidatePath("/dashboard/contacts");
        return {
            success: true,
            successCount,
            failedCount: failedRows.length,
            details: failedRows.length > 0 ? failedRows : undefined,
        };
    } catch (e: any) {
        console.error("CSV Upload Error:", e);
        return { success: false, error: "An unexpected error occurred during upload" };
    }
}

export async function bulkDeleteContacts(ids: string[]) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await db
            .delete(contacts)
            .where(and(inArray(contacts.id, ids), eq(contacts.tenantId, session.tenantId)));

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        console.error("Bulk Delete Error:", e);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function bulkAddTags(ids: string[], tags: string[]) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const targetContacts = await db
            .select({ id: contacts.id, tags: contacts.tags })
            .from(contacts)
            .where(and(inArray(contacts.id, ids), eq(contacts.tenantId, session.tenantId)));

        for (const contact of targetContacts) {
            const currentTags = contact.tags || [];
            const newTags = Array.from(new Set([...currentTags, ...tags]));
            await db
                .update(contacts)
                .set({ tags: newTags, updatedAt: new Date() })
                .where(eq(contacts.id, contact.id));
        }

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        console.error("Bulk Add Tags Error:", e);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function getContactActivities(contactId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const activities = await db
            .select()
            .from(contactActivities)
            .where(
                and(
                    eq(contactActivities.contactId, contactId),
                    eq(contactActivities.tenantId, session.tenantId)
                )
            )
            .orderBy(desc(contactActivities.createdAt));

        const formatted = activities.map((a) => ({
            id: a.id,
            contact_id: a.contactId,
            tenant_id: a.tenantId,
            type: a.type as "sms" | "email" | "note" | "call_log" | "system",
            content: a.content,
            metadata: (a.metadata as Record<string, any>) || {},
            created_at: a.createdAt.toISOString(),
            created_by: a.createdBy || "",
        }));

        return { success: true, data: formatted };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch activities" };
    }
}

export async function createActivity(
    contactId: string,
    type: "note" | "call_log" | "sms" | "email" | "system",
    content: string
) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, session.tenantId)))
            .limit(1);

        if (!contact) return { success: false, error: "Contact not found or access denied" };

        await db.insert(contactActivities).values({
            contactId,
            tenantId: session.tenantId,
            type,
            content,
            createdBy: session.user.id,
        });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to create activity" };
    }
}

export async function getContactViews() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const views = await db
            .select()
            .from(contactViews)
            .where(eq(contactViews.tenantId, session.tenantId))
            .orderBy(asc(contactViews.createdAt));

        const formatted = views.map((v) => ({
            id: v.id,
            tenant_id: v.tenantId,
            name: v.name,
            filters: v.filters,
            created_at: v.createdAt.toISOString(),
            created_by: v.createdBy,
        }));

        return { success: true, data: formatted };
    } catch (e: any) {
        return { success: false, error: "Failed to fetch views" };
    }
}

export async function saveContactView(name: string, filters: any) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await db.insert(contactViews).values({
            tenantId: session.tenantId,
            name,
            filters,
            createdBy: session.user.id,
        });

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to save view" };
    }
}

export async function deleteContactView(id: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await db
            .delete(contactViews)
            .where(and(eq(contactViews.id, id), eq(contactViews.tenantId, session.tenantId)));

        revalidatePath("/dashboard/contacts");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Failed to delete view" };
    }
}
