"use server";

import { requirePermission } from "@/lib/rbac/guard";
import { withPermission } from "@/lib/actions/action-handler";
import { FormService } from "@/lib/services/form.service";
import { revalidatePath } from "next/cache";
import type { Form } from "@/types/form";

export async function getForms() {
    try {
        const session = await requirePermission("forms.read");
        return await FormService.getForms(session.tenantId);
    } catch (error) {
        console.error("Error fetching forms:", error);
        return [];
    }
}

export async function getForm(id: string) {
    try {
        const session = await requirePermission("forms.read");
        return await FormService.getForm(session.tenantId, id);
    } catch (error) {
        console.error("Error fetching form:", error);
        return null;
    }
}

export async function createForm(name: string, description?: string) {
    return await withPermission("forms.write", async (session) => {
        const form = await FormService.createForm(session.tenantId, name, description);
        revalidatePath("/dashboard/forms");
        return form;
    });
}

export async function updateForm(id: string, updates: Partial<Form>) {
    return await withPermission("forms.write", async (session) => {
        await FormService.updateForm(session.tenantId, id, updates);
        revalidatePath("/dashboard/forms");
        revalidatePath(`/dashboard/forms/${id}`);
        return { success: true };
    });
}

export async function deleteForm(id: string) {
    return await withPermission("forms.delete", async (session) => {
        await FormService.deleteForm(session.tenantId, id);
        revalidatePath("/dashboard/forms");
        return { success: true };
    });
}
