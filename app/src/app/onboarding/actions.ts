"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOnboarding(data: {
    step?: number;
    completed?: boolean;
    industry?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const updates: any = {};
    if (data.step !== undefined) updates.onboarding_step = data.step;
    if (data.completed !== undefined) updates.onboarding_completed = data.completed;
    if (data.industry) updates.industry = data.industry;
    if (data.role) updates.role_in_company = data.role;
    if (data.firstName || data.lastName) {
        updates.full_name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
    }

    const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/onboarding");
    return { success: true };
}

export async function completeOnboarding() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    return { success: true };
}
