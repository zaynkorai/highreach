"use server";

import { withPermission } from "@/lib/actions/action-handler";
import { FormService } from "@/lib/services/form.service";
import { revalidatePath } from "next/cache";
import type { Form, FormField } from "@/types/form";

export async function getForms() {
    return await withPermission("forms.read", async (session) => {
        return await FormService.getForms(session.tenantId);
    });
}

export async function getForm(id: string) {
    return await withPermission("forms.read", async (session) => {
        return await FormService.getForm(session.tenantId, id);
    });
}

export async function createForm(name: string, description?: string, fields: FormField[] = []) {
    return await withPermission("forms.write", async (session) => {
        const form = await FormService.createForm(session.tenantId, name, description, fields);
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

export async function getSubmissions(formId: string) {
    return await withPermission("forms.read", async (session) => {
        return await FormService.getSubmissions(session.tenantId, formId);
    });
}

export async function deleteSubmission(formId: string, submissionId: string) {
    return await withPermission("forms.delete", async (session) => {
        await FormService.deleteSubmission(session.tenantId, submissionId);
        revalidatePath(`/dashboard/forms/${formId}`);
        revalidatePath("/dashboard/forms");
        return { success: true };
    });
}

