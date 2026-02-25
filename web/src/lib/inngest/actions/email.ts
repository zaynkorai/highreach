import { resend } from "@/lib/resend";
import { formatTemplate } from "../utils/helpers";
import { WorkflowNode } from "../types";

export async function handleSendEmail(
    node: WorkflowNode,
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string,
    supabase: any
) {
    const to = triggerData.contact?.email || triggerData.email;
    if (!to) throw new Error("No email address found for communication");

    const subject = formatTemplate(config.subject || "New Message", triggerData);
    const content = formatTemplate(config.template, triggerData);

    const { error } = await resend.emails.send({
        from: 'HighReach \u003conboarding@resend.dev\u003e', // In production use tenant verified domain
        to: [to],
        subject: subject,
        text: content,
    });

    if (error) throw new Error(`Resend Error: ${error.message}`);

    if (triggerData.contact?.id) {
        await supabase.from("contact_activities").insert({
            contact_id: triggerData.contact.id,
            tenant_id: tenantId,
            type: "email_sent",
            content: content,
            metadata: { provider: "resend", subject, workflow_node_id: node.id }
        });
    }

    await supabase.from("usage_logs").insert({
        tenant_id: tenantId,
        resource_type: "email",
        quantity: 1,
        metadata: { to, subject, node_id: node.id }
    });
}
