import { telnyx } from "@/lib/telnyx";
import { formatTemplate } from "../utils/helpers";
import { WorkflowNode } from "../types";

export async function handleSendSms(
    node: WorkflowNode,
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
    supabase: any
) {
    const to = triggerData.contact?.phone || triggerData.phone;
    if (!to) throw new Error("No phone number found for SMS");

    const { data: tenant } = await supabase.from("tenants").select("sms_number").eq("id", tenantId).single();
    if (!tenant?.sms_number) throw new Error("Tenant has no SMS number configured");

    const message = formatTemplate(config.template, triggerData);

    await (telnyx.messages as any).create({
        from: tenant.sms_number,
        to,
        text: message
    });

    if (triggerData.contact?.id) {
        await supabase.from("contact_activities").insert({
            contact_id: triggerData.contact.id,
            tenant_id: tenantId,
            type: "sms_sent",
            content: message,
            metadata: { provider: "telnyx", workflow_node_id: node.id }
        });
    }

    await supabase.from("usage_logs").insert({
        tenant_id: tenantId,
        resource_type: "sms",
        quantity: 1,
        metadata: { to, node_id: node.id }
    });
}
