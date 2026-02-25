
import { createAdminClient } from "@/lib/supabase/admin";

export async function getWorkflowSetting(tenantId: string, key: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("workflow_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("key", key)
        .single();

    // Default to disabled if not found
    return data || { enabled: false, config: {} };
}
