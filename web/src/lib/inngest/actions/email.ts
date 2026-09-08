import { resend } from "@/lib/resend";
import { formatTemplate } from "../utils/helpers";
import { WorkflowNode } from "../types";
import { db } from "@/lib/db";
import { contactActivities, usageLogs } from "@/lib/db/schema";

export async function handleSendEmail(
    node: WorkflowNode,
    config: Record<string, any>,
    triggerData: Record<string, any>,
    tenantId: string
) {
    const to = triggerData.contact?.email || triggerData.email;
    if (!to) throw new Error("No email address found for communication");

    const subject = formatTemplate(config.subject || "New Message", triggerData);
    const content = formatTemplate(config.template, triggerData);

    const { error } = await resend.emails.send({
        from: 'HighReach <onboarding@resend.dev>', // In production use tenant verified domain
        to: [to],
        subject: subject,
        text: content,
    });

    if (error) throw new Error(`Resend Error: ${error.message}`);

    if (triggerData.contact?.id) {
        await db.insert(contactActivities).values({
            contactId: triggerData.contact.id,
            tenantId: tenantId,
            type: "email_sent",
            content: content,
            metadata: { provider: "resend", subject, workflow_node_id: node.id }
        });
    }

    await db.insert(usageLogs).values({
        tenantId: tenantId,
        resourceType: "email",
        quantity: 1,
        metadata: { to, subject, node_id: node.id }
    });
}
