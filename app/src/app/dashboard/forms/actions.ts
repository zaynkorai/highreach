"use server";

import { createClient } from "@/lib/supabase/server";
import { Form, FormField } from "@/types/form";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getForms() {
    const supabase = await createClient();

    // Get forms with submission counts
    const { data, error } = await supabase
        .from("forms")
        .select(`
            *,
            submissions:form_submissions(count)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data.map((form: any) => ({
        ...form,
        submissions_count: form.submissions?.[0]?.count || 0,
    }));
}

export async function getForm(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return null;
    }

    return data as Form;
}

export async function createForm(name: string, description?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    if (!userData) throw new Error("No tenant");

    const { data, error } = await supabase
        .from("forms")
        .insert({
            tenant_id: userData.tenant_id,
            name,
            description,
            fields: [], // Start empty
            status: "draft",
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/forms");
    return data;
}

export async function updateForm(id: string, updates: Partial<Form>) {
    const supabase = await createClient();

    // Clean up fields to ensure they match JSON type if passed
    const payload = { ...updates };

    const { error } = await supabase
        .from("forms")
        .update(payload)
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/forms");
    revalidatePath(`/dashboard/forms/${id}`);
    return { success: true };
}

export async function deleteForm(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("forms").delete().eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/forms");
    return { success: true };
}
