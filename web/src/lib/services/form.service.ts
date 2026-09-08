import { db, forms, formSubmissions } from "@/lib/db";
import { eq, desc, and, sql } from "drizzle-orm";
import type { Form, FormField, FormTheme, FormWithStats } from "@/types/form";

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
            description: undefined,
            fields: Array.isArray(f.fields) ? (f.fields as unknown as FormField[]) : [],
            theme: (f.theme as unknown as FormTheme) || undefined,
            redirect_url: f.redirectUrl || undefined,
            status: "active" as const,
            views: 0,
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
            fields: Array.isArray(found.fields) ? (found.fields as unknown as FormField[]) : [],
            theme: (found.theme as unknown as FormTheme) || undefined,
            redirect_url: found.redirectUrl || undefined,
            status: "active",
            views: 0,
            created_at: found.createdAt.toISOString(),
            updated_at: found.updatedAt.toISOString(),
        };
    }

    static async createForm(tenantId: string, name: string, description?: string) {
        const [created] = await db
            .insert(forms)
            .values({
                tenantId,
                name,
                fields: [],
            })
            .returning();

        return {
            id: created.id,
            tenant_id: created.tenantId,
            name: created.name,
            description,
            fields: created.fields,
            redirect_url: created.redirectUrl,
            created_at: created.createdAt.toISOString(),
            updated_at: created.updatedAt.toISOString(),
        };
    }

    static async updateForm(tenantId: string, id: string, updates: Partial<Form>) {
        const setValues: Partial<typeof forms.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (updates.name !== undefined) setValues.name = updates.name;
        if (updates.fields !== undefined) setValues.fields = updates.fields;
        if (updates.redirect_url !== undefined) setValues.redirectUrl = updates.redirect_url;
        if (updates.theme !== undefined) setValues.theme = updates.theme;

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
}
