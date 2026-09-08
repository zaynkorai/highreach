import { db, contacts, contactActivities, contactViews } from "@/lib/db";
import { eq, inArray, desc, asc, and, sql } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { parse } from "csv-parse/sync";
import { contactSchema } from "@/lib/validations/contact";
import type { CreateContactDTO, UpdateContactDTO } from "@/types/contact";

export class ContactService {
    static async createContact(
        tenantId: string,
        data: CreateContactDTO
    ) {
        const validatedFields = contactSchema.safeParse({
            firstName: data.first_name,
            lastName: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            tags: data.tags || [],
            source: data.source || "manual",
        });

        if (!validatedFields.success) {
            throw new Error(`Validation failed: ${JSON.stringify(validatedFields.error.flatten())}`);
        }

        const [inserted] = await db
            .insert(contacts)
            .values({
                tenantId,
                firstName: validatedFields.data.firstName,
                lastName: validatedFields.data.lastName || null,
                email: validatedFields.data.email || null,
                phone: validatedFields.data.phone || null,
                source: validatedFields.data.source || "manual",
                tags: validatedFields.data.tags || [],
            })
            .returning();

        if (inserted) {
            try {
                await inngest.send({
                    name: "contact.created",
                    data: {
                        contact_id: inserted.id,
                        tenant_id: tenantId,
                        source: inserted.source || "manual",
                    },
                });
            } catch (err) {
                console.warn("Inngest send error:", err);
            }
        }

        return {
            id: inserted.id,
            tenant_id: inserted.tenantId,
            first_name: inserted.firstName,
            last_name: inserted.lastName,
            email: inserted.email,
            phone: inserted.phone,
            tags: inserted.tags || [],
            source: inserted.source,
            notes: inserted.notes,
            created_at: inserted.createdAt.toISOString(),
            updated_at: inserted.updatedAt.toISOString(),
        };
    }

    static async updateContact(
        tenantId: string,
        contactId: string,
        data: UpdateContactDTO
    ) {
        const validatedFields = contactSchema.safeParse({
            firstName: data.first_name,
            lastName: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            tags: data.tags || [],
            source: data.source || "manual",
        });

        if (!validatedFields.success) {
            throw new Error(`Validation failed: ${JSON.stringify(validatedFields.error.flatten())}`);
        }

        const [updated] = await db
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
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Contact not found or access denied");
        }

        return updated;
    }

    static async deleteContact(tenantId: string, contactId: string) {
        const [deleted] = await db
            .delete(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)))
            .returning({ id: contacts.id });

        if (!deleted) {
            throw new Error("Contact not found or access denied");
        }
        return deleted;
    }

    static async bulkDeleteContacts(tenantId: string, ids: string[]) {
        if (!ids.length) return { count: 0 };
        const deleted = await db
            .delete(contacts)
            .where(and(inArray(contacts.id, ids), eq(contacts.tenantId, tenantId)))
            .returning({ id: contacts.id });
        return { count: deleted.length };
    }

    static async bulkAddTags(tenantId: string, ids: string[], tags: string[]) {
        if (!ids.length || !tags.length) return;

        const tagArray = sql`ARRAY[${sql.join(tags.map((t) => sql`${t}`), sql`, `)}]::text[]`;

        await db
            .update(contacts)
            .set({
                tags: sql`ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(${contacts.tags}, ARRAY[]::text[]), ${tagArray})))`,
                updatedAt: new Date(),
            })
            .where(
                and(
                    inArray(contacts.id, ids),
                    eq(contacts.tenantId, tenantId)
                )
            );
    }

    static async getContactActivities(tenantId: string, contactId: string) {
        return await db
            .select()
            .from(contactActivities)
            .where(
                and(
                    eq(contactActivities.contactId, contactId),
                    eq(contactActivities.tenantId, tenantId)
                )
            )
            .orderBy(desc(contactActivities.createdAt));
    }

    static async createContactActivity(
        tenantId: string,
        contactId: string,
        userId: string,
        type: "note" | "call_log" | "sms" | "email" | "system",
        content: string
    ) {
        const [contact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)))
            .limit(1);

        if (!contact) {
            throw new Error("Contact not found or access denied");
        }

        await db.insert(contactActivities).values({
            contactId,
            tenantId,
            type,
            content,
            createdBy: userId,
        });
    }

    static async getContactViews(tenantId: string) {
        const views = await db
            .select()
            .from(contactViews)
            .where(eq(contactViews.tenantId, tenantId))
            .orderBy(asc(contactViews.createdAt));

        return views.map((v) => ({
            id: v.id,
            tenant_id: v.tenantId,
            name: v.name,
            filters: v.filters,
            created_at: v.createdAt.toISOString(),
            created_by: v.createdBy,
        }));
    }

    static async saveContactView(tenantId: string, userId: string, name: string, filters: unknown) {
        await db.insert(contactViews).values({
            tenantId,
            name,
            filters,
            createdBy: userId,
        });
    }

    static async deleteContactView(tenantId: string, id: string) {
        await db
            .delete(contactViews)
            .where(and(eq(contactViews.id, id), eq(contactViews.tenantId, tenantId)));
    }

    static async parseAndImportCsv(tenantId: string, csvContent: string) {
        const rawData = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        if (!rawData || (rawData as unknown[]).length === 0) {
            throw new Error("No records found in CSV");
        }

        const failedRows: Array<{ row: number; data: unknown; errors: unknown }> = [];
        const contactsToInsert: Array<typeof contacts.$inferInsert> = [];

        const rows = rawData as Array<Record<string, string>>;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const mappedData = {
                firstName: row["firstName"] || row["First Name"] || row["first name"] || row["first_name"] || row["Name"] || row["name"],
                lastName: row["lastName"] || row["Last Name"] || row["last name"] || row["last_metric"] || row["last_name"] || "",
                email: row["email"] || row["Email"] || row["E-mail"] || "",
                phone: row["phone"] || row["Phone"] || row["Phone Number"] || row["phone_number"] || "",
            };

            const validatedFields = contactSchema.safeParse(mappedData);
            if (validatedFields.success) {
                contactsToInsert.push({
                    tenantId,
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
        }

        return {
            successCount: contactsToInsert.length,
            failedCount: failedRows.length,
            details: failedRows.length > 0 ? failedRows : undefined,
        };
    }
}
