"use server";

import { getSessionWithRole } from "@/lib/auth/session";
import { db, forms, formSubmissions } from "@/lib/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { Form } from "@/types/form";
import { revalidatePath } from "next/cache";

export async function getForms() {
    const session = await getSessionWithRole();
    if (!session) throw new Error("Unauthorized");

    const formsList = await db
        .select()
        .from(forms)
        .where(eq(forms.tenantId, session.tenantId))
        .orderBy(desc(forms.createdAt));

    // Get submission counts per form
    const counts = await db
        .select({
            formId: formSubmissions.formId,
            count: sql<number>`count(*)::int`,
        })
        .from(formSubmissions)
        .where(eq(formSubmissions.tenantId, session.tenantId))
        .groupBy(formSubmissions.formId);

    const countMap = new Map(counts.map((c) => [c.formId, c.count]));

    return formsList.map((f) => ({
        id: f.id,
        tenant_id: f.tenantId,
        name: f.name,
        fields: f.fields as any,
        theme: f.theme as any,
        redirect_url: f.redirectUrl || undefined,
        status: "active" as const,
        views: 0,
        created_at: f.createdAt.toISOString(),
        updated_at: f.updatedAt.toISOString(),
        submissions_count: countMap.get(f.id) || 0,
    }));
}

export async function getForm(id: string) {
    const session = await getSessionWithRole();
    if (!session) return null;

    const [found] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, id), eq(forms.tenantId, session.tenantId)))
        .limit(1);

    if (!found) return null;

    return {
        id: found.id,
        tenant_id: found.tenantId,
        name: found.name,
        fields: found.fields as any,
        theme: found.theme as any,
        redirect_url: found.redirectUrl || undefined,
        status: "active" as const,
        views: 0,
        created_at: found.createdAt.toISOString(),
        updated_at: found.updatedAt.toISOString(),
    } as unknown as Form;
}

export async function createForm(name: string, description?: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const [created] = await db
            .insert(forms)
            .values({
                tenantId: session.tenantId,
                name,
                fields: [],
            })
            .returning();

        revalidatePath("/dashboard/forms");
        return {
            success: true,
            data: {
                id: created.id,
                tenant_id: created.tenantId,
                name: created.name,
                fields: created.fields,
                redirect_url: created.redirectUrl,
                created_at: created.createdAt.toISOString(),
                updated_at: created.updatedAt.toISOString(),
            },
        };
    } catch (e: any) {
        console.error("createForm Error:", e);
        return { success: false, error: e.message || "Failed to create form" };
    }
}

export async function updateForm(id: string, updates: Partial<Form>) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        const setValues: Partial<typeof forms.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (updates.name !== undefined) setValues.name = updates.name;
        if (updates.fields !== undefined) setValues.fields = updates.fields as any;
        if (updates.redirect_url !== undefined) setValues.redirectUrl = updates.redirect_url;
        if ((updates as any).theme !== undefined) setValues.theme = (updates as any).theme;

        await db
            .update(forms)
            .set(setValues)
            .where(and(eq(forms.id, id), eq(forms.tenantId, session.tenantId)));

        revalidatePath("/dashboard/forms");
        revalidatePath(`/dashboard/forms/${id}`);
        return { success: true };
    } catch (e: any) {
        console.error("updateForm Error:", e);
        return { success: false, error: e.message || "Failed to update form" };
    }
}

export async function deleteForm(id: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { success: false, error: "Unauthorized" };

        await db
            .delete(forms)
            .where(and(eq(forms.id, id), eq(forms.tenantId, session.tenantId)));

        revalidatePath("/dashboard/forms");
        return { success: true };
    } catch (e: any) {
        console.error("deleteForm Error:", e);
        return { success: false, error: e.message || "Failed to delete form" };
    }
}
