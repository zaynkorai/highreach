import { db, forms, formSubmissions, contacts } from "@/lib/db";
import { eq, desc, and, sql } from "drizzle-orm";
import type { Form, FormField, FormTheme, FormWithStats, FormSubmissionWithContact } from "@/types/form";

export class FormService {
    static async getForms(tenantId: string): Promise<FormWithStats[]> {
        const formsList = await db
            .select()
            .from(forms)
            .where(eq(forms.tenantId, tenantId))
            .orderBy(desc(forms.createdAt));

        const counts = await db
            .select({
                formId: formSubmissions.formId,
                count: sql<number>`count(*)::int`,
            })
            .from(formSubmissions)
            .where(eq(formSubmissions.tenantId, tenantId))
            .groupBy(formSubmissions.formId);

        const countMap = new Map(counts.map((c) => [c.formId, c.count]));

        return formsList.map((f) => ({
            id: f.id,
            tenant_id: f.tenantId,
            name: f.name,
            description: f.description || undefined,
            fields: Array.isArray(f.fields) ? (f.fields as unknown as FormField[]) : [],
            theme: (f.theme as unknown as FormTheme) || undefined,
            redirect_url: f.redirectUrl || undefined,
            status: (f.status as any) || "active",
            views: f.views || 0,
            created_at: f.createdAt.toISOString(),
            updated_at: f.updatedAt.toISOString(),
            submissions_count: countMap.get(f.id) || 0,
        }));
    }

    static async getForm(tenantId: string, id: string): Promise<Form | null> {
        const [found] = await db
            .select()
            .from(forms)
            .where(and(eq(forms.id, id), eq(forms.tenantId, tenantId)))
            .limit(1);

        if (!found) return null;

        return {
            id: found.id,
            tenant_id: found.tenantId,
            name: found.name,
            description: found.description || undefined,
            fields: Array.isArray(found.fields) ? (found.fields as unknown as FormField[]) : [],
            theme: (found.theme as unknown as FormTheme) || undefined,
            redirect_url: found.redirectUrl || undefined,
            status: (found.status as any) || "active",
            views: found.views || 0,
            created_at: found.createdAt.toISOString(),
            updated_at: found.updatedAt.toISOString(),
        };
    }

    static async createForm(tenantId: string, name: string, description?: string, fields: FormField[] = []) {
        const [created] = await db
            .insert(forms)
            .values({
                tenantId,
                name,
                description: description || null,
                status: "active",
                fields: fields as any,
                views: 0,
            })
            .returning();

        return {
            id: created.id,
            tenant_id: created.tenantId,
            name: created.name,
            description: created.description || undefined,
            fields: created.fields as unknown as FormField[],
            redirect_url: created.redirectUrl,
            status: (created.status as any) || "active",
            views: created.views || 0,
            created_at: created.createdAt.toISOString(),
            updated_at: created.updatedAt.toISOString(),
        };
    }

    static async updateForm(tenantId: string, id: string, updates: Partial<Form>) {
        const setValues: Partial<typeof forms.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (updates.name !== undefined) setValues.name = updates.name;
        if (updates.description !== undefined) setValues.description = updates.description;
        if (updates.status !== undefined) setValues.status = updates.status;
        if (updates.fields !== undefined) setValues.fields = updates.fields as any;
        if (updates.redirect_url !== undefined) setValues.redirectUrl = updates.redirect_url;
        if (updates.theme !== undefined) setValues.theme = updates.theme as any;

        const [updated] = await db
            .update(forms)
            .set(setValues)
            .where(and(eq(forms.id, id), eq(forms.tenantId, tenantId)))
            .returning();

        if (!updated) {
            throw new Error("Form not found or access denied");
        }
        return updated;
    }

    static async deleteForm(tenantId: string, id: string) {
        const [deleted] = await db
            .delete(forms)
            .where(and(eq(forms.id, id), eq(forms.tenantId, tenantId)))
            .returning();

        if (!deleted) {
            throw new Error("Form not found or access denied");
        }
        return deleted;
    }

    static async incrementFormViews(formId: string) {
        await db
            .update(forms)
            .set({ views: sql`${forms.views} + 1` })
            .where(eq(forms.id, formId));
    }

    static async getSubmissions(tenantId: string, formId: string): Promise<FormSubmissionWithContact[]> {
        const rows = await db
            .select({
                submission: formSubmissions,
                contact: {
                    id: contacts.id,
                    firstName: contacts.firstName,
                    lastName: contacts.lastName,
                    email: contacts.email,
                    phone: contacts.phone,
                },
            })
            .from(formSubmissions)
            .leftJoin(contacts, eq(formSubmissions.contactId, contacts.id))
            .where(and(eq(formSubmissions.tenantId, tenantId), eq(formSubmissions.formId, formId)))
            .orderBy(desc(formSubmissions.submittedAt));

        return rows.map((r) => ({
            id: r.submission.id,
            tenant_id: r.submission.tenantId,
            form_id: r.submission.formId,
            contact_id: r.submission.contactId || undefined,
            data: (r.submission.data as Record<string, any>) || {},
            submitted_at: r.submission.submittedAt ? r.submission.submittedAt.toISOString() : new Date().toISOString(),
            contact: r.contact?.id ? r.contact : null,
        }));
    }

    static async deleteSubmission(tenantId: string, submissionId: string) {
        const [deleted] = await db
            .delete(formSubmissions)
            .where(and(eq(formSubmissions.id, submissionId), eq(formSubmissions.tenantId, tenantId)))
            .returning();

        if (!deleted) {
            throw new Error("Submission not found or access denied");
        }
        return deleted;
    }
}

