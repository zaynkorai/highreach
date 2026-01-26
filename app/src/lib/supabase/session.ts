import { createClient } from "@/lib/supabase/server";

export async function getSessionDetail() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { user: null, tenantId: null, supabase };

    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

    return {
        user,
        tenantId: userData?.tenant_id || null,
        supabase
    };
}
